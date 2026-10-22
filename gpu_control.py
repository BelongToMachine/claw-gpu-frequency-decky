"""Safe, Claw A1M-only access to Intel i915 GT0 frequency limits."""

from pathlib import Path
import os
import re
from typing import Dict, List, Optional, Tuple


PRODUCT_NAME = "Claw A1M"
SYSTEM_VENDOR = "Micro-Star International Co., Ltd."
INTEL_VENDOR_ID = "0x8086"
FREQUENCY_STEP_MHZ = 50
THROTTLE_REASON_NODES = (
    ("pl1", "throttle_reason_pl1"),
    ("pl2", "throttle_reason_pl2"),
    ("pl4", "throttle_reason_pl4"),
    ("thermal", "throttle_reason_thermal"),
    ("prochot", "throttle_reason_prochot"),
    ("ratl", "throttle_reason_ratl"),
    ("vr_thermalert", "throttle_reason_vr_thermalert"),
    ("vr_tdc", "throttle_reason_vr_tdc"),
)


class GPUFrequencyError(RuntimeError):
    """Raised when the expected Claw GPU interface is unavailable or rejects a change."""


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8").strip()
    except OSError as exc:
        raise GPUFrequencyError(f"Cannot read {path}: {exc}") from exc


def _read_int(path: Path) -> int:
    value = _read_text(path)
    try:
        return int(value)
    except ValueError as exc:
        raise GPUFrequencyError(f"Unexpected value in {path}: {value!r}") from exc


def _read_optional_int(path: Path) -> Optional[int]:
    if not path.exists():
        return None
    return _read_int(path)


def _discover_gt0() -> Tuple[str, Path]:
    product = _read_text(Path("/sys/class/dmi/id/product_name"))
    vendor = _read_text(Path("/sys/class/dmi/id/sys_vendor"))
    if product != PRODUCT_NAME or vendor != SYSTEM_VENDOR:
        raise GPUFrequencyError(
            f"Unsupported device ({vendor} {product}); this plugin only supports MSI Claw A1M."
        )

    cards = sorted(Path("/sys/class/drm").glob("card[0-9]*"))
    matches: List[Tuple[str, Path]] = []
    for card in cards:
        if not re.fullmatch(r"card\d+", card.name):
            continue

        vendor_path = card / "device" / "vendor"
        driver_path = card / "device" / "driver"
        if not vendor_path.exists() or not driver_path.exists():
            continue
        if _read_text(vendor_path).lower() != INTEL_VENDOR_ID:
            continue
        try:
            driver_name = os.path.basename(os.path.realpath(driver_path))
        except OSError:
            continue
        if driver_name != "i915":
            continue

        gt0 = card / "gt" / "gt0"
        required_nodes = (
            "rps_min_freq_mhz",
            "rps_max_freq_mhz",
            "rps_boost_freq_mhz",
            "rps_RPn_freq_mhz",
            "rps_RP0_freq_mhz",
            "rps_act_freq_mhz",
        )
        if all((gt0 / node).exists() for node in required_nodes):
            matches.append((card.name, gt0))

    if len(matches) != 1:
        raise GPUFrequencyError(
            f"Expected one Intel i915 GT0 frequency interface, found {len(matches)}."
        )
    return matches[0]


def _read_state() -> Dict[str, object]:
    card_name, gt0 = _discover_gt0()
    min_freq = _read_int(gt0 / "rps_min_freq_mhz")
    max_freq = _read_int(gt0 / "rps_max_freq_mhz")
    boost_freq = _read_int(gt0 / "rps_boost_freq_mhz")
    requested_freq = _read_optional_int(gt0 / "rps_cur_freq_mhz")
    firmware_requested_freq = _read_optional_int(gt0 / "punit_req_freq_mhz")
    hw_min = _read_int(gt0 / "rps_RPn_freq_mhz")
    hw_max = _read_int(gt0 / "rps_RP0_freq_mhz")
    actual_freq = _read_int(gt0 / "rps_act_freq_mhz")
    throttled = _read_optional_int(gt0 / "throttle_reason_status") == 1
    throttle_reasons = [
        reason
        for reason, node in THROTTLE_REASON_NODES
        if _read_optional_int(gt0 / node) == 1
    ]

    if hw_min <= 0 or hw_max < hw_min:
        raise GPUFrequencyError(f"Invalid hardware frequency range: {hw_min}–{hw_max} MHz.")
    if (
        min_freq < hw_min
        or max_freq > hw_max
        or min_freq > max_freq
        or boost_freq < hw_min
        or boost_freq > hw_max
    ):
        raise GPUFrequencyError(
            f"Driver reported invalid frequency settings: limits {min_freq}–{max_freq} MHz, "
            f"boost {boost_freq} MHz "
            f"(hardware range {hw_min}–{hw_max} MHz)."
        )

    return {
        "supported": True,
        "device": PRODUCT_NAME,
        "driver": "i915",
        "card": card_name,
        "gt": "gt0",
        "actualFreqMhz": actual_freq if actual_freq > 0 else None,
        "requestedFreqMhz": requested_freq,
        "firmwareRequestedFreqMhz": firmware_requested_freq,
        "throttled": throttled,
        "throttleReasons": throttle_reasons,
        "minFreqMhz": min_freq,
        "maxFreqMhz": max_freq,
        "boostFreqMhz": boost_freq,
        "hwMinFreqMhz": hw_min,
        "hwMaxFreqMhz": hw_max,
        "stepMhz": FREQUENCY_STEP_MHZ,
    }


def get_gpu_state() -> Dict[str, object]:
    """Read the live state without changing any hardware setting."""
    try:
        return _read_state()
    except GPUFrequencyError:
        raise
    except OSError as exc:
        raise GPUFrequencyError(f"Cannot access the GPU frequency interface: {exc}") from exc


def _write_frequency(gt0: Path, key: str, value: int) -> None:
    path = gt0 / key
    try:
        path.write_text(f"{value}\n", encoding="ascii")
    except OSError as exc:
        raise GPUFrequencyError(f"Could not write {value} MHz to {path}: {exc}") from exc


def _transition_range(gt0: Path, minimum: int, maximum: int) -> None:
    current_min = _read_int(gt0 / "rps_min_freq_mhz")
    current_max = _read_int(gt0 / "rps_max_freq_mhz")
    if minimum > current_max:
        # Raise the ceiling before raising the floor so the intermediate range stays valid.
        _write_frequency(gt0, "rps_max_freq_mhz", maximum)
        _write_frequency(gt0, "rps_min_freq_mhz", minimum)
    elif maximum < current_min:
        # Lower the floor before lowering the ceiling.
        _write_frequency(gt0, "rps_min_freq_mhz", minimum)
        _write_frequency(gt0, "rps_max_freq_mhz", maximum)
    else:
        # The old and new ranges overlap, so either ordered transition remains valid.
        if minimum != current_min:
            _write_frequency(gt0, "rps_min_freq_mhz", minimum)
        if maximum != current_max:
            _write_frequency(gt0, "rps_max_freq_mhz", maximum)


def _apply_range(
    minimum: int,
    maximum: int,
    boost_frequency: Optional[int] = None,
) -> Dict[str, object]:
    card_name, gt0 = _discover_gt0()
    hw_min = _read_int(gt0 / "rps_RPn_freq_mhz")
    hw_max = _read_int(gt0 / "rps_RP0_freq_mhz")
    if minimum < hw_min or maximum > hw_max or minimum > maximum:
        raise GPUFrequencyError(
            f"Requested range {minimum}–{maximum} MHz is outside hardware limits "
            f"{hw_min}–{hw_max} MHz."
        )
    if boost_frequency is not None and not hw_min <= boost_frequency <= hw_max:
        raise GPUFrequencyError(
            f"Requested boost frequency {boost_frequency} MHz is outside hardware limits "
            f"{hw_min}–{hw_max} MHz."
        )

    old_min = _read_int(gt0 / "rps_min_freq_mhz")
    old_max = _read_int(gt0 / "rps_max_freq_mhz")
    old_boost = _read_int(gt0 / "rps_boost_freq_mhz")
    try:
        _transition_range(gt0, minimum, maximum)
        new_min = _read_int(gt0 / "rps_min_freq_mhz")
        new_max = _read_int(gt0 / "rps_max_freq_mhz")
        if (new_min, new_max) != (minimum, maximum):
            raise GPUFrequencyError(
                f"Driver read back {new_min}–{new_max} MHz after requesting "
                f"{minimum}–{maximum} MHz."
            )
        if boost_frequency is not None:
            _write_frequency(gt0, "rps_boost_freq_mhz", boost_frequency)
            new_boost = _read_int(gt0 / "rps_boost_freq_mhz")
            if new_boost != boost_frequency:
                raise GPUFrequencyError(
                    f"Driver read back boost {new_boost} MHz after requesting "
                    f"{boost_frequency} MHz."
                )
        # Read back identity and live values inside the rollback scope as well.
        state = _read_state()
        if state["card"] != card_name:
            raise GPUFrequencyError("The detected GPU changed while applying the frequency request.")
    except Exception as exc:
        rollback_error = None
        try:
            _transition_range(gt0, old_min, old_max)
            restored_min = _read_int(gt0 / "rps_min_freq_mhz")
            restored_max = _read_int(gt0 / "rps_max_freq_mhz")
            if (restored_min, restored_max) != (old_min, old_max):
                rollback_error = GPUFrequencyError(
                    f"read back {restored_min}–{restored_max} MHz"
                )
        except Exception as rollback_exc:  # Preserve the original failure and report rollback status.
            rollback_error = rollback_exc
        try:
            _write_frequency(gt0, "rps_boost_freq_mhz", old_boost)
            restored_boost = _read_int(gt0 / "rps_boost_freq_mhz")
            if restored_boost != old_boost:
                boost_error = GPUFrequencyError(f"read back boost {restored_boost} MHz")
                rollback_error = boost_error if rollback_error is None else GPUFrequencyError(
                    f"{rollback_error}; {boost_error}"
                )
        except Exception as rollback_exc:
            rollback_error = rollback_exc if rollback_error is None else GPUFrequencyError(
                f"{rollback_error}; {rollback_exc}"
            )
        message = str(exc)
        if rollback_error:
            message += (
                f" Rollback to limits {old_min}–{old_max} MHz and boost "
                f"{old_boost} MHz also failed: {rollback_error}"
            )
        else:
            message += (
                f" Previous limits {old_min}–{old_max} MHz and boost "
                f"{old_boost} MHz were restored."
            )
        raise GPUFrequencyError(message) from exc

    return state


def set_fixed_frequency(frequency_mhz: int) -> Dict[str, object]:
    """Request a fixed GT0 frequency by setting the i915 min/max limits equally."""
    if isinstance(frequency_mhz, bool) or not isinstance(frequency_mhz, int):
        raise GPUFrequencyError("Frequency must be an integer MHz value.")

    card_name, gt0 = _discover_gt0()
    hw_min = _read_int(gt0 / "rps_RPn_freq_mhz")
    hw_max = _read_int(gt0 / "rps_RP0_freq_mhz")
    if frequency_mhz < hw_min or frequency_mhz > hw_max:
        raise GPUFrequencyError(
            f"Frequency {frequency_mhz} MHz is outside the hardware range "
            f"{hw_min}–{hw_max} MHz."
        )
    if (frequency_mhz - hw_min) % FREQUENCY_STEP_MHZ != 0:
        raise GPUFrequencyError(
            f"Frequency must use {FREQUENCY_STEP_MHZ} MHz increments from {hw_min} MHz."
        )

    state = _apply_range(frequency_mhz, frequency_mhz, boost_frequency=frequency_mhz)
    if state["card"] != card_name:
        raise GPUFrequencyError("The detected GPU changed while applying the frequency request.")
    return state


def restore_automatic_frequency() -> Dict[str, object]:
    """Release manual limits and restore the GPU's full hardware frequency range."""
    card_name, gt0 = _discover_gt0()
    hw_min = _read_int(gt0 / "rps_RPn_freq_mhz")
    hw_max = _read_int(gt0 / "rps_RP0_freq_mhz")
    state = _apply_range(hw_min, hw_max, boost_frequency=hw_max)
    if state["card"] != card_name:
        raise GPUFrequencyError("The detected GPU changed while restoring automatic limits.")
    return state
