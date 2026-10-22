import os
import sys

PLUGIN_DIR = os.path.dirname(os.path.abspath(__file__))
if PLUGIN_DIR not in sys.path:
    sys.path.insert(0, PLUGIN_DIR)

import decky_plugin

from gpu_control import (
    GPUFrequencyError,
    get_gpu_state,
    get_package_power_state as read_package_power_state,
    restore_automatic_frequency,
    set_package_tdp,
    set_fixed_frequency,
)


class Plugin:
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

    async def _main(self):
        decky_plugin.logger.info("Claw GPU Frequency loaded; no hardware values changed.")

    async def _unload(self):
        decky_plugin.logger.info("Claw GPU Frequency unloaded.")
