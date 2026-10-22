from contextlib import ExitStack
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import gpu_control


class PackageTdpControlTest(unittest.TestCase):
    def _seed_rapl_package(self, parent, name, pl1, pl1_max, pl2, pl2_max):
        package = parent / name
        package.mkdir(parents=True)
        for node, value in {
            "constraint_0_power_limit_uw": pl1,
            "constraint_0_max_power_uw": pl1_max,
            "constraint_1_power_limit_uw": pl2,
            "constraint_1_max_power_uw": pl2_max,
        }.items():
            (package / node).write_text(f"{value}\n", encoding="ascii")
        return package

    def _seed_device(self, root):
        msr = self._seed_rapl_package(
            root / "powercap" / "intel-rapl", "intel-rapl:0", 25000000, 28000000, 45000000, 0
        )
        mmio = self._seed_rapl_package(
            root / "powercap" / "intel-rapl-mmio", "intel-rapl-mmio:0", 10000000, 28000000, 10000000, 0
        )
        vendor_path = root / "sys_vendor"
        product_path = root / "product_name"
        vendor_path.write_text("Micro-Star International Co., Ltd.\n", encoding="ascii")
        product_path.write_text("Claw A1M\n", encoding="ascii")
        return msr, mmio, vendor_path, product_path

    def _patch_paths(self, msr, mmio, vendor_path, product_path):
        return (
            patch.object(gpu_control, "MSR_RAPL_PACKAGE_PATH", msr),
            patch.object(gpu_control, "MMIO_RAPL_PACKAGE_PATH", mmio, create=True),
            patch.object(gpu_control, "SYS_VENDOR_PATH", vendor_path),
            patch.object(gpu_control, "PRODUCT_NAME_PATH", product_path),
        )

    def test_power_state_reports_effective_lower_limit_and_shared_range(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            msr, mmio, vendor_path, product_path = self._seed_device(Path(temp_dir))

            with ExitStack() as stack:
                for patcher in self._patch_paths(msr, mmio, vendor_path, product_path):
                    stack.enter_context(patcher)
                state = gpu_control.get_package_power_state()

            self.assertTrue(state["supported"])
            self.assertEqual("MSR + MMIO RAPL", state["interface"])
            self.assertEqual(10, state["currentTdpW"])
            self.assertEqual(5, state["minTdpW"])
            self.assertEqual(28, state["maxTdpW"])

    def test_setting_tdp_synchronizes_both_limits_on_msr_and_mmio(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            msr, mmio, vendor_path, product_path = self._seed_device(Path(temp_dir))

            with ExitStack() as stack:
                for patcher in self._patch_paths(msr, mmio, vendor_path, product_path):
                    stack.enter_context(patcher)
                state = gpu_control.set_package_tdp(18)

            for package in (msr, mmio):
                for node in ("constraint_0_power_limit_uw", "constraint_1_power_limit_uw"):
                    self.assertEqual("18000000\n", (package / node).read_text(encoding="ascii"))
            self.assertEqual(18, state["currentTdpW"])

    def test_tdp_above_shared_hardware_limit_is_rejected_without_writes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            msr, mmio, vendor_path, product_path = self._seed_device(Path(temp_dir))

            with ExitStack() as stack:
                for patcher in self._patch_paths(msr, mmio, vendor_path, product_path):
                    stack.enter_context(patcher)
                with self.assertRaises(gpu_control.GPUFrequencyError):
                    gpu_control.set_package_tdp(29)

            self.assertEqual("25000000\n", (msr / "constraint_0_power_limit_uw").read_text())
            self.assertEqual("45000000\n", (msr / "constraint_1_power_limit_uw").read_text())
            self.assertEqual("10000000\n", (mmio / "constraint_0_power_limit_uw").read_text())
            self.assertEqual("10000000\n", (mmio / "constraint_1_power_limit_uw").read_text())

    def test_setting_tdp_refuses_other_devices_without_writing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            msr, mmio, vendor_path, product_path = self._seed_device(Path(temp_dir))
            product_path.write_text("Other Device\n", encoding="ascii")

            with ExitStack() as stack:
                for patcher in self._patch_paths(msr, mmio, vendor_path, product_path):
                    stack.enter_context(patcher)
                with self.assertRaises(gpu_control.GPUFrequencyError):
                    gpu_control.set_package_tdp(18)

            self.assertEqual("25000000\n", (msr / "constraint_0_power_limit_uw").read_text())
            self.assertEqual("10000000\n", (mmio / "constraint_0_power_limit_uw").read_text())


if __name__ == "__main__":
    unittest.main()
