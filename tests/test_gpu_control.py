import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import gpu_control


class FixedFrequencyTest(unittest.TestCase):
    def _seed_nodes(self, gt0, values):
        for node, value in values.items():
            (gt0 / node).write_text(f"{value}\n", encoding="ascii")

    def test_fixed_frequency_updates_min_max_and_boost(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            gt0 = Path(temp_dir)
            self._seed_nodes(gt0, {
                "rps_min_freq_mhz": 1800,
                "rps_max_freq_mhz": 1800,
                "rps_boost_freq_mhz": 2200,
                "rps_RPn_freq_mhz": 800,
                "rps_RP0_freq_mhz": 2200,
                "rps_act_freq_mhz": 1800,
            })

            with patch.object(gpu_control, "_discover_gt0", return_value=("card0", gt0)):
                state = gpu_control.set_fixed_frequency(1850)

            self.assertEqual(1850, int((gt0 / "rps_min_freq_mhz").read_text()))
            self.assertEqual(1850, int((gt0 / "rps_max_freq_mhz").read_text()))
            self.assertEqual(1850, int((gt0 / "rps_boost_freq_mhz").read_text()))
            self.assertEqual(1850, state["minFreqMhz"])
            self.assertEqual(1850, state["maxFreqMhz"])
            self.assertEqual(1850, state["boostFreqMhz"])

    def test_restore_automatic_sets_boost_to_hardware_max(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            gt0 = Path(temp_dir)
            self._seed_nodes(gt0, {
                "rps_min_freq_mhz": 1850,
                "rps_max_freq_mhz": 1850,
                "rps_boost_freq_mhz": 1850,
                "rps_RPn_freq_mhz": 800,
                "rps_RP0_freq_mhz": 2200,
                "rps_act_freq_mhz": 1850,
            })

            with patch.object(gpu_control, "_discover_gt0", return_value=("card0", gt0)):
                state = gpu_control.restore_automatic_frequency()

            self.assertEqual(800, int((gt0 / "rps_min_freq_mhz").read_text()))
            self.assertEqual(2200, int((gt0 / "rps_max_freq_mhz").read_text()))
            self.assertEqual(2200, int((gt0 / "rps_boost_freq_mhz").read_text()))
            self.assertEqual(2200, state["boostFreqMhz"])

    def test_state_reports_firmware_request_and_active_pl1_limit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            gt0 = Path(temp_dir)
            self._seed_nodes(gt0, {
                "rps_min_freq_mhz": 2000,
                "rps_max_freq_mhz": 2000,
                "rps_boost_freq_mhz": 2000,
                "rps_cur_freq_mhz": 2000,
                "punit_req_freq_mhz": 2000,
                "rps_RPn_freq_mhz": 800,
                "rps_RP0_freq_mhz": 2200,
                "rps_act_freq_mhz": 250,
                "throttle_reason_status": 1,
                "throttle_reason_pl1": 1,
                "throttle_reason_pl2": 0,
                "throttle_reason_pl4": 0,
                "throttle_reason_thermal": 0,
                "throttle_reason_prochot": 0,
                "throttle_reason_ratl": 0,
                "throttle_reason_vr_thermalert": 0,
                "throttle_reason_vr_tdc": 0,
            })

            with patch.object(gpu_control, "_discover_gt0", return_value=("card0", gt0)):
                state = gpu_control.get_gpu_state()

            self.assertEqual(2000, state["requestedFreqMhz"])
            self.assertEqual(2000, state["firmwareRequestedFreqMhz"])
            self.assertEqual(["pl1"], state["throttleReasons"])


if __name__ == "__main__":
    unittest.main()
