from contextlib import ExitStack
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import gpu_control


class PackagePL1ControlTest(unittest.TestCase):
    def _seed_msr_package(self, root):
        package = root / "intel-rapl" / "intel-rapl:0"
        package.mkdir(parents=True)
        (package / "constraint_0_power_limit_uw").write_text("9000000\n", encoding="ascii")
        (package / "constraint_0_max_power_uw").write_text("28000000\n", encoding="ascii")
        (package / "constraint_1_power_limit_uw").write_text("45000000\n", encoding="ascii")
        vendor_path = root / "sys_vendor"
        product_path = root / "product_name"
        vendor_path.write_text("Micro-Star International Co., Ltd.\n", encoding="ascii")
        product_path.write_text("Claw A1M\n", encoding="ascii")
        return package, vendor_path, product_path

    def _patch_msr_paths(self, package, vendor_path, product_path):
        return (
            patch.object(gpu_control, "MSR_RAPL_PACKAGE_PATH", package, create=True),
            patch.object(gpu_control, "SYS_VENDOR_PATH", vendor_path, create=True),
            patch.object(gpu_control, "PRODUCT_NAME_PATH", product_path, create=True),
        )

    def test_setting_pl1_writes_only_the_msr_long_term_limit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            package, vendor_path, product_path = self._seed_msr_package(root)
            pl1_path = package / "constraint_0_power_limit_uw"
            pl2_path = package / "constraint_1_power_limit_uw"

            with ExitStack() as stack:
                for patcher in self._patch_msr_paths(package, vendor_path, product_path):
                    stack.enter_context(patcher)
                gpu_control.set_package_pl1(25)

            self.assertEqual("25000000\n", pl1_path.read_text(encoding="ascii"))
            self.assertEqual("45000000\n", pl2_path.read_text(encoding="ascii"))

    def test_power_state_reports_current_and_hardware_max_from_msr(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            package, vendor_path, product_path = self._seed_msr_package(root)

            with ExitStack() as stack:
                for patcher in self._patch_msr_paths(package, vendor_path, product_path):
                    stack.enter_context(patcher)
                state = gpu_control.get_package_power_state()

            self.assertTrue(state.get("supported"))
            self.assertEqual("MSR RAPL", state.get("interface"))
            self.assertEqual(9, state.get("currentPl1W"))
            self.assertEqual(28, state.get("maxPl1W"))

    def test_setting_pl1_above_hardware_maximum_is_rejected_without_writing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            package, vendor_path, product_path = self._seed_msr_package(root)
            pl1_path = package / "constraint_0_power_limit_uw"

            with ExitStack() as stack:
                for patcher in self._patch_msr_paths(package, vendor_path, product_path):
                    stack.enter_context(patcher)
                rejected = False
                try:
                    gpu_control.set_package_pl1(29)
                except gpu_control.GPUFrequencyError:
                    rejected = True

            self.assertTrue(rejected)
            self.assertEqual("9000000\n", pl1_path.read_text(encoding="ascii"))

    def test_setting_pl1_refuses_other_devices_without_writing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            package, vendor_path, product_path = self._seed_msr_package(root)
            product_path.write_text("Other Device\n", encoding="ascii")
            pl1_path = package / "constraint_0_power_limit_uw"

            with ExitStack() as stack:
                for patcher in self._patch_msr_paths(package, vendor_path, product_path):
                    stack.enter_context(patcher)
                rejected = False
                try:
                    gpu_control.set_package_pl1(25)
                except gpu_control.GPUFrequencyError:
                    rejected = True

            self.assertTrue(rejected)
            self.assertEqual("9000000\n", pl1_path.read_text(encoding="ascii"))


if __name__ == "__main__":
    unittest.main()
