import os
import sys

PLUGIN_DIR = os.path.dirname(os.path.abspath(__file__))
if PLUGIN_DIR not in sys.path:
    sys.path.insert(0, PLUGIN_DIR)

import decky_plugin

from cpu_control import (
    CPUControlError,
    get_cpu_control_state as read_cpu_control_state,
    set_cpu_boost,
    set_cpu_cluster_frequency_limit,
    set_cpu_core_counts,
    set_cpu_governor,
    set_smt,
)

from gpu_control import (
    GPUFrequencyError,
    get_gpu_state,
    get_package_power_state as read_package_power_state,
    restore_automatic_frequency,
    set_package_tdp,
    set_fixed_frequency,
)
from profile_control import (
    ProfileControlError,
    apply_game_profile as apply_saved_game_profile,
    get_game_profiles as read_game_profiles,
    save_game_profile as save_current_game_profile,
)


class Plugin:
    async def get_cpu_control_state(self):
        try:
            return read_cpu_control_state()
        except CPUControlError as exc:
            return {"supported": False, "error": str(exc)}

    async def set_cpu_boost(self, enabled: bool):
        return set_cpu_boost(enabled)

    async def set_smt(self, enabled: bool):
        return set_smt(enabled)

    async def set_cpu_core_counts(self, p_core_count: int, e_core_count: int):
        return set_cpu_core_counts(p_core_count, e_core_count)

    async def set_cpu_cluster_frequency_limit(self, core_type: str, frequency_mhz: int):
        return set_cpu_cluster_frequency_limit(core_type, frequency_mhz)

    async def set_cpu_governor(self, governor: str):
        return set_cpu_governor(governor)

    async def get_gpu_state(self):
        try:
            return get_gpu_state()
        except GPUFrequencyError as exc:
            return {"supported": False, "error": str(exc)}

    async def set_gpu_frequency(self, frequency: int):
        return set_fixed_frequency(frequency)

    async def restore_gpu_automatic(self):
        return restore_automatic_frequency()

    async def get_package_power_state(self):
        try:
            return read_package_power_state()
        except GPUFrequencyError as exc:
            return {"supported": False, "error": str(exc)}

    async def set_package_tdp(self, power_watts: int):
        return set_package_tdp(power_watts)

    async def get_game_profiles(self, app_id: int):
        try:
            return read_game_profiles(app_id)
        except ProfileControlError as exc:
            return {"supported": False, "appId": app_id, "error": str(exc)}

    async def save_game_profile(self, app_id: int, game_name: str, mode: str):
        return save_current_game_profile(app_id, game_name, mode)

    async def apply_game_profile(self, app_id: int, mode: str):
        return apply_saved_game_profile(app_id, mode)

    async def _main(self):
        decky_plugin.logger.info("Claw GPU Frequency loaded; no hardware values changed.")

    async def _unload(self):
        decky_plugin.logger.info("Claw GPU Frequency unloaded.")
