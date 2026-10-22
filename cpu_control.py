"""Claw A1M CPU boost, SMT, and cpufreq governor controls."""

from pathlib import Path
import re
from typing import Dict, List, Optional, Sequence, Tuple


PRODUCT_NAME = "Claw A1M"
SYSTEM_VENDOR = "Micro-Star International Co., Ltd."
SYS_VENDOR_PATH = Path("/sys/class/dmi/id/sys_vendor")
PRODUCT_NAME_PATH = Path("/sys/class/dmi/id/product_name")
CPU_ROOT = Path("/sys/devices/system/cpu")
ONLINE_CPUS_PATH = CPU_ROOT / "online"
INTEL_PSTATE_NO_TURBO_PATH = CPU_ROOT / "intel_pstate" / "no_turbo"
SMT_CONTROL_PATH = CPU_ROOT / "smt" / "control"


class CPUControlError(RuntimeError):
    """Raised when a Claw A1M CPU control is unavailable or rejects a change."""


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8").strip()
    except OSError as exc:
        raise CPUControlError(f"Cannot read {path}: {exc}") from exc


def _ensure_supported_device() -> None:
    vendor = _read_text(SYS_VENDOR_PATH)
    product = _read_text(PRODUCT_NAME_PATH)
    if vendor != SYSTEM_VENDOR or product != PRODUCT_NAME:
        raise CPUControlError(
            f"Unsupported device ({vendor} {product}); CPU controls only support MSI Claw A1M."
        )


def _parse_cpu_list(value: str) -> List[int]:
    cpus = set()
    for part in value.split(","):
        match = re.fullmatch(r"(\d+)(?:-(\d+))?", part.strip())
        if not match:
            raise CPUControlError(f"Unexpected CPU list value: {value!r}.")
        start = int(match.group(1))
        end = int(match.group(2) or start)
        if end < start:
            raise CPUControlError(f"Unexpected CPU range in {value!r}.")
        cpus.update(range(start, end + 1))
    return sorted(cpus)


def _online_cpu_ids() -> List[int]:
    if ONLINE_CPUS_PATH.exists():
        return _parse_cpu_list(_read_text(ONLINE_CPUS_PATH))

    online = []
    for cpu_dir in CPU_ROOT.glob("cpu[0-9]*"):
        match = re.fullmatch(r"cpu(\d+)", cpu_dir.name)
        if not match:
            continue
        online_path = cpu_dir / "online"
        if not online_path.exists() or _read_text(online_path) == "1":
            online.append(int(match.group(1)))
    return sorted(online)


def _governor_paths() -> List[Path]:
    paths: List[Path] = []
    seen = set()
    for cpu_id in _online_cpu_ids():
        governor_path = CPU_ROOT / f"cpu{cpu_id}" / "cpufreq" / "scaling_governor"
        if not governor_path.exists():
            continue
        try:
            resolved = governor_path.resolve(strict=True)
        except OSError as exc:
            raise CPUControlError(f"Cannot resolve CPU governor interface {governor_path}: {exc}") from exc
        if resolved not in seen:
            paths.append(resolved)
            seen.add(resolved)
    return paths


def _governor_info(paths: Optional[Sequence[Path]] = None) -> Dict[str, object]:
    policy_paths = list(paths if paths is not None else _governor_paths())
    if not policy_paths:
        return {
            "governorSupported": False,
            "currentGovernor": None,
            "availableGovernors": [],
        }

    current_values = [_read_text(path) for path in policy_paths]
    option_sets = []
    for path in policy_paths:
        available_path = path.parent / "scaling_available_governors"
        if not available_path.exists():
            return {
                "governorSupported": False,
                "currentGovernor": current_values[0] if len(set(current_values)) == 1 else None,
                "availableGovernors": [],
                "governorError": f"Governor options are unavailable at {available_path}.",
            }
        option_sets.append(set(_read_text(available_path).split()))

    common_governors = sorted(set.intersection(*option_sets))
    return {
        "governorSupported": bool(common_governors),
        "currentGovernor": current_values[0] if len(set(current_values)) == 1 else None,
        "availableGovernors": common_governors,
        "governorMixed": len(set(current_values)) > 1,
    }


def get_cpu_control_state() -> Dict[str, object]:
    """Read CPU controls without changing their values."""
    _ensure_supported_device()

    boost_supported = INTEL_PSTATE_NO_TURBO_PATH.exists()
    boost_enabled: Optional[bool] = None
    boost_error = None
    if boost_supported:
        try:
            raw_boost = _read_text(INTEL_PSTATE_NO_TURBO_PATH)
            if raw_boost not in {"0", "1"}:
                raise CPUControlError(f"Unexpected Intel pstate no_turbo value: {raw_boost!r}.")
            boost_enabled = raw_boost == "0"
        except CPUControlError as exc:
            boost_supported = False
            boost_error = str(exc)

    smt_enabled: Optional[bool] = None
    smt_supported = False
    smt_mode = None
    smt_error = None
    if SMT_CONTROL_PATH.exists():
        try:
            smt_mode = _read_text(SMT_CONTROL_PATH)
            smt_supported = smt_mode in {"on", "off"}
            if smt_supported:
                smt_enabled = smt_mode == "on"
        except CPUControlError as exc:
            smt_error = str(exc)
    else:
        smt_error = f"SMT control is unavailable at {SMT_CONTROL_PATH}."

    governor_state = _governor_info()
    return {
        "supported": True,
        "device": PRODUCT_NAME,
        "cpuBoostSupported": boost_supported,
        "cpuBoostEnabled": boost_enabled,
        "cpuBoostError": boost_error,
        "smtSupported": smt_supported,
        "smtEnabled": smt_enabled,
        "smtMode": smt_mode,
        "smtError": smt_error,
        "onlineCPUs": ",".join(str(cpu) for cpu in _online_cpu_ids()),
        **governor_state,
    }


def _write_and_verify(path: Path, value: str, control_name: str) -> None:
    try:
        path.write_text(f"{value}\n", encoding="ascii")
    except OSError as exc:
        raise CPUControlError(f"Could not write {value!r} to {control_name}: {exc}") from exc
    actual = _read_text(path)
    if actual != value:
        raise CPUControlError(f"{control_name} read back {actual!r} after requesting {value!r}.")


def set_cpu_boost(enabled: bool) -> Dict[str, object]:
    """Set Intel turbo boost (no_turbo is inverse-valued)."""
    if not isinstance(enabled, bool):
        raise CPUControlError("CPU Boost must be enabled or disabled.")
    _ensure_supported_device()
    if not INTEL_PSTATE_NO_TURBO_PATH.exists():
        raise CPUControlError(f"CPU Boost is unavailable at {INTEL_PSTATE_NO_TURBO_PATH}.")
    _write_and_verify(INTEL_PSTATE_NO_TURBO_PATH, "0" if enabled else "1", "CPU Boost")
    return get_cpu_control_state()


def set_smt(enabled: bool) -> Dict[str, object]:
    """Set Linux SMT control when the kernel reports it is toggleable."""
    if not isinstance(enabled, bool):
        raise CPUControlError("SMT must be enabled or disabled.")
    _ensure_supported_device()
    if not SMT_CONTROL_PATH.exists():
        raise CPUControlError(f"SMT control is unavailable at {SMT_CONTROL_PATH}.")
    current = _read_text(SMT_CONTROL_PATH)
    if current not in {"on", "off"}:
        raise CPUControlError(f"SMT cannot be changed while the kernel reports {current!r}.")
    _write_and_verify(SMT_CONTROL_PATH, "on" if enabled else "off", "SMT")
    return get_cpu_control_state()


def set_cpu_governor(governor: str) -> Dict[str, object]:
    """Set a common supported governor on every online CPU frequency policy."""
    if not isinstance(governor, str) or not governor:
        raise CPUControlError("A CPU governor must be selected.")
    _ensure_supported_device()
    paths = _governor_paths()
    state = _governor_info(paths)
    available = state["availableGovernors"]
    if governor not in available:
        raise CPUControlError(
            f"Governor {governor!r} is not available on every online CPU policy. "
            f"Available choices: {', '.join(available) or 'none'}."
        )

    previous = [(path, _read_text(path)) for path in paths]
    attempted: List[Tuple[Path, str]] = []
    try:
        for path, old_value in previous:
            attempted.append((path, old_value))
            _write_and_verify(path, governor, f"CPU governor {path}")
    except Exception as exc:
        rollback_errors = []
        for path, old_value in reversed(attempted):
            try:
                _write_and_verify(path, old_value, f"CPU governor rollback {path}")
            except Exception as rollback_exc:
                rollback_errors.append(str(rollback_exc))
        suffix = "" if not rollback_errors else " Rollback errors: " + "; ".join(rollback_errors)
        raise CPUControlError(f"Could not apply CPU governor: {exc}.{suffix}") from exc

    return get_cpu_control_state()
