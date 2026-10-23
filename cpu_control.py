"""Claw A1M CPU boost, P/E core groups, frequency caps, SMT, and governor controls."""

from pathlib import Path
import json
import os
import re
from typing import Dict, List, Optional, Sequence, Tuple


PRODUCT_NAME = "Claw A1M"
SYSTEM_VENDOR = "Micro-Star International Co., Ltd."
SYS_VENDOR_PATH = Path("/sys/class/dmi/id/sys_vendor")
PRODUCT_NAME_PATH = Path("/sys/class/dmi/id/product_name")
CPU_ROOT = Path("/sys/devices/system/cpu")
ONLINE_CPUS_PATH = CPU_ROOT / "online"
PRESENT_CPUS_PATH = CPU_ROOT / "present"
INTEL_PSTATE_NO_TURBO_PATH = CPU_ROOT / "intel_pstate" / "no_turbo"
SMT_CONTROL_PATH = CPU_ROOT / "smt" / "control"

# Verified on the Claw A1M's 4P + 4E BIOS configuration. Fail closed when the
# firmware exposes a different logical CPU set so we never apply class controls
# to guessed CPU numbers.
P_CORE_CPU_GROUPS = ((0, 1), (2, 3), (4, 5), (6, 7))
E_CORE_CPUS = (8, 9, 10, 11)
P_CORE_FREQUENCY_FALLBACK_MAX_MHZ = 4600
E_CORE_FREQUENCY_FALLBACK_MAX_MHZ = 3600
CORE_FREQUENCY_FALLBACK_MIN_MHZ = 400


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


def _cpu_settings_path() -> Path:
    settings_dir = os.environ.get("DECKY_PLUGIN_SETTINGS_DIR")
    if not settings_dir:
        decky_home = Path(os.environ.get("DECKY_HOME", "/home/deck/homebrew"))
        settings_dir = str(decky_home / "settings" / "ClawGPUFrequency")
    return Path(settings_dir) / "cpu-control.json"


def _load_cpu_preferences() -> Dict[str, int]:
    path = _cpu_settings_path()
    if not path.exists():
        return {}
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise CPUControlError(f"Cannot read CPU control settings {path}: {exc}") from exc
    if not isinstance(raw, dict):
        raise CPUControlError(f"CPU control settings at {path} must contain a JSON object.")

    preferences: Dict[str, int] = {}
    for key in ("pCoreMaxFreqMhz", "eCoreMaxFreqMhz"):
        value = raw.get(key)
        if isinstance(value, int) and not isinstance(value, bool) and value > 0:
            preferences[key] = value
    return preferences


def _save_cpu_preference(key: str, value: int) -> None:
    preferences = _load_cpu_preferences()
    preferences[key] = value
    path = _cpu_settings_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = path.with_suffix(".tmp")
        temporary_path.write_text(
            json.dumps(preferences, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        temporary_path.replace(path)
    except OSError as exc:
        raise CPUControlError(f"Cannot save CPU control settings {path}: {exc}") from exc


def _validate_core_control_layout(online_ids: Optional[Sequence[int]] = None) -> None:
    expected_present = list(range(12))
    present_ids = _parse_cpu_list(_read_text(PRESENT_CPUS_PATH))
    if present_ids != expected_present:
        raise CPUControlError(
            "P/E core controls require the verified 4P + 4E topology with logical CPUs 0–11; "
            f"the system currently reports present CPUs {','.join(str(cpu) for cpu in present_ids)}."
        )

    online = set(online_ids if online_ids is not None else _online_cpu_ids())
    for group in P_CORE_CPU_GROUPS:
        if not set(group).issubset(online):
            continue
        for cpu_id in group:
            siblings_path = CPU_ROOT / f"cpu{cpu_id}" / "topology" / "thread_siblings_list"
            siblings = _parse_cpu_list(_read_text(siblings_path))
            if siblings != list(group):
                raise CPUControlError(
                    f"CPU {cpu_id} reports SMT siblings {siblings}, expected P-core group {list(group)}."
                )

    for cpu_id in E_CORE_CPUS:
        if cpu_id not in online:
            continue
        siblings_path = CPU_ROOT / f"cpu{cpu_id}" / "topology" / "thread_siblings_list"
        siblings = _parse_cpu_list(_read_text(siblings_path))
        if siblings != [cpu_id]:
            raise CPUControlError(
                f"CPU {cpu_id} reports thread siblings {siblings}; expected a single-thread E-core."
            )


def _frequency_policy_paths(cpu_ids: Sequence[int]) -> List[Path]:
    online = set(_online_cpu_ids())
    paths: List[Path] = []
    seen = set()
    for cpu_id in cpu_ids:
        if cpu_id not in online:
            continue
        path = CPU_ROOT / f"cpu{cpu_id}" / "cpufreq" / "scaling_max_freq"
        if not path.exists():
            continue
        try:
            resolved = path.resolve(strict=True)
        except OSError as exc:
            raise CPUControlError(f"Cannot resolve CPU frequency policy {path}: {exc}") from exc
        if resolved not in seen:
            paths.append(resolved)
            seen.add(resolved)
    return paths


def _frequency_policy_bounds(paths: Sequence[Path], fallback_max_mhz: int) -> Tuple[int, int]:
    minimums = []
    maximums = []
    for path in paths:
        min_path = path.parent / "cpuinfo_min_freq"
        max_path = path.parent / "cpuinfo_max_freq"
        if min_path.exists():
            minimums.append(int(_read_text(min_path)))
        if max_path.exists():
            maximums.append(int(_read_text(max_path)))
    minimum_khz = max(minimums) if minimums else CORE_FREQUENCY_FALLBACK_MIN_MHZ * 1000
    maximum_khz = min(maximums) if maximums else fallback_max_mhz * 1000
    if minimum_khz > maximum_khz:
        raise CPUControlError(
            f"CPU frequency policies have no shared range ({minimum_khz}–{maximum_khz} kHz)."
        )
    return max(1, minimum_khz // 1000), max(1, maximum_khz // 1000)


def _cluster_current_frequency(cpu_ids: Sequence[int]) -> Tuple[Optional[int], Optional[int], int]:
    online = set(_online_cpu_ids())
    values = []
    seen = set()
    for cpu_id in cpu_ids:
        if cpu_id not in online:
            continue
        cpufreq_dir = CPU_ROOT / f"cpu{cpu_id}" / "cpufreq"
        for node in ("cpuinfo_cur_freq", "scaling_cur_freq"):
            path = cpufreq_dir / node
            if not path.exists():
                continue
            try:
                resolved = path.resolve(strict=True)
            except OSError:
                continue
            if resolved in seen:
                break
            seen.add(resolved)
            try:
                value = int(_read_text(resolved))
            except (CPUControlError, ValueError):
                continue
            if value > 0:
                values.append(value // 1000)
                break
    if not values:
        return None, None, 0
    return min(values), max(values), len(values)


def _cluster_frequency_state(
    prefix: str,
    cpu_ids: Sequence[int],
    fallback_max_mhz: int,
    preferences: Dict[str, int],
) -> Dict[str, object]:
    paths = _frequency_policy_paths(cpu_ids)
    minimum_mhz, maximum_mhz = _frequency_policy_bounds(paths, fallback_max_mhz)
    online_class_cpus = set(cpu_ids) & set(_online_cpu_ids())
    saved_mhz = preferences.get(f"{prefix}CoreMaxFreqMhz")
    if online_class_cpus and not paths:
        return {
            f"{prefix}CoreFrequencySupported": False,
            f"{prefix}CoreFrequencyError": "No CPUFreq maximum-frequency policy is available for online cores.",
            f"{prefix}CoreFrequencyMinMhz": minimum_mhz,
            f"{prefix}CoreFrequencyMaxMhz": maximum_mhz,
            f"{prefix}CoreFrequencyCurrentMhz": None,
            f"{prefix}CoreFrequencyTargetMhz": saved_mhz,
            f"{prefix}CoreFrequencyMixed": False,
            f"{prefix}CoreFrequencyOnlinePolicies": 0,
        }
    current_values = [int(_read_text(path)) // 1000 for path in paths]
    current_mhz = current_values[0] if current_values and len(set(current_values)) == 1 else None
    actual_min_mhz, actual_max_mhz, actual_readings = _cluster_current_frequency(cpu_ids)
    return {
        f"{prefix}CoreFrequencySupported": True,
        f"{prefix}CoreFrequencyMinMhz": minimum_mhz,
        f"{prefix}CoreFrequencyMaxMhz": maximum_mhz,
        f"{prefix}CoreFrequencyCurrentMhz": current_mhz,
        f"{prefix}CoreFrequencyTargetMhz": saved_mhz if saved_mhz is not None else current_mhz,
        f"{prefix}CoreFrequencyMixed": bool(current_values and current_mhz is None),
        f"{prefix}CoreFrequencyOnlinePolicies": len(paths),
        f"{prefix}CoreActualFrequencyMinMhz": actual_min_mhz,
        f"{prefix}CoreActualFrequencyMaxMhz": actual_max_mhz,
        f"{prefix}CoreActualFrequencyReadings": actual_readings,
    }


def _online_ids_for_core_counts(p_core_count: int, e_core_count: int, smt_enabled: bool) -> set:
    return _online_ids_for_core_groups(
        P_CORE_CPU_GROUPS[:p_core_count], E_CORE_CPUS[:e_core_count], smt_enabled
    )


def _online_ids_for_core_groups(
    p_core_groups: Sequence[Sequence[int]],
    e_core_ids: Sequence[int],
    smt_enabled: bool,
) -> set:
    selected = {0}
    for group in p_core_groups:
        selected.add(group[0])
        if smt_enabled:
            selected.add(group[1])
    selected.update(e_core_ids)
    return selected


def _set_cpu_online(cpu_id: int, online: bool) -> None:
    if cpu_id == 0:
        if not online:
            raise CPUControlError("CPU 0 belongs to P-core 1 and cannot be taken offline by this control.")
        return
    path = CPU_ROOT / f"cpu{cpu_id}" / "online"
    if not path.exists():
        raise CPUControlError(f"CPU {cpu_id} hotplug interface is unavailable at {path}.")
    _write_and_verify(path, "1" if online else "0", f"CPU {cpu_id} online state")


def _apply_online_cpu_ids(desired_ids: Sequence[int]) -> None:
    desired = set(desired_ids)
    if 0 not in desired:
        raise CPUControlError("The desired topology must keep CPU 0 online.")
    current = set(_online_cpu_ids())
    for cpu_id in sorted(current - desired - {0}, reverse=True):
        _set_cpu_online(cpu_id, False)
    for cpu_id in sorted(desired - current):
        _set_cpu_online(cpu_id, True)


def _restore_cpu_topology(online_ids: Sequence[int], smt_mode: str) -> List[str]:
    errors = []
    if smt_mode in {"on", "off"} and SMT_CONTROL_PATH.exists():
        try:
            current_mode = _read_text(SMT_CONTROL_PATH)
            if current_mode != smt_mode:
                _write_and_verify(SMT_CONTROL_PATH, smt_mode, "SMT rollback")
        except CPUControlError as exc:
            errors.append(str(exc))
    try:
        _apply_online_cpu_ids(online_ids)
    except CPUControlError as exc:
        errors.append(str(exc))
    return errors


def _write_cluster_frequency_limit(
    cpu_ids: Sequence[int],
    frequency_mhz: int,
    fallback_max_mhz: int,
) -> List[Tuple[Path, str]]:
    paths = _frequency_policy_paths(cpu_ids)
    if not paths:
        return []
    minimum_mhz, maximum_mhz = _frequency_policy_bounds(paths, fallback_max_mhz)
    if frequency_mhz < minimum_mhz or frequency_mhz > maximum_mhz:
        raise CPUControlError(
            f"Requested {frequency_mhz} MHz is outside the active policy range {minimum_mhz}–{maximum_mhz} MHz."
        )

    previous = [(path, _read_text(path)) for path in paths]
    attempted: List[Tuple[Path, str]] = []
    try:
        for path, old_value in previous:
            attempted.append((path, old_value))
            _write_and_verify(path, str(frequency_mhz * 1000), f"CPU frequency limit {path}")
    except Exception as exc:
        rollback_errors = []
        for path, old_value in reversed(attempted):
            try:
                _write_and_verify(path, old_value, f"CPU frequency rollback {path}")
            except Exception as rollback_exc:
                rollback_errors.append(str(rollback_exc))
        suffix = "" if not rollback_errors else " Rollback errors: " + "; ".join(rollback_errors)
        raise CPUControlError(f"Could not apply CPU frequency limit: {exc}.{suffix}") from exc
    return previous


def _apply_saved_frequency_limits() -> None:
    try:
        preferences = _load_cpu_preferences()
    except CPUControlError:
        return
    applied: List[Tuple[Path, str]] = []
    try:
        for key, cpu_ids, fallback_max_mhz in (
            ("pCoreMaxFreqMhz", tuple(cpu for group in P_CORE_CPU_GROUPS for cpu in group), P_CORE_FREQUENCY_FALLBACK_MAX_MHZ),
            ("eCoreMaxFreqMhz", E_CORE_CPUS, E_CORE_FREQUENCY_FALLBACK_MAX_MHZ),
        ):
            frequency_mhz = preferences.get(key)
            if frequency_mhz is not None:
                paths = _frequency_policy_paths(cpu_ids)
                if not paths:
                    continue
                minimum_mhz, maximum_mhz = _frequency_policy_bounds(paths, fallback_max_mhz)
                effective_mhz = min(max(frequency_mhz, minimum_mhz), maximum_mhz)
                applied.extend(_write_cluster_frequency_limit(cpu_ids, effective_mhz, fallback_max_mhz))
                if effective_mhz != frequency_mhz:
                    _save_cpu_preference(key, effective_mhz)
    except Exception:
        for path, old_value in reversed(applied):
            try:
                _write_and_verify(path, old_value, f"CPU frequency rollback {path}")
            except CPUControlError:
                pass
        raise


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
    core_state = _core_control_state()
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
        **core_state,
    }


def _core_control_state() -> Dict[str, object]:
    try:
        online_ids = _online_cpu_ids()
        _validate_core_control_layout(online_ids)
    except CPUControlError as exc:
        return {
            "coreControlSupported": False,
            "coreControlError": str(exc),
            "pCoreCount": None,
            "eCoreCount": None,
            "pCoreGroups": [],
            "eCoreCPUs": [],
        }

    online = set(online_ids)
    p_core_count = sum(bool(set(group) & online) for group in P_CORE_CPU_GROUPS)
    e_core_count = sum(cpu_id in online for cpu_id in E_CORE_CPUS)
    preferences: Dict[str, int] = {}
    preference_error = None
    try:
        preferences = _load_cpu_preferences()
    except CPUControlError as exc:
        preference_error = str(exc)

    state: Dict[str, object] = {
        "coreControlSupported": True,
        "coreControlError": None,
        "pCoreCount": p_core_count,
        "pCoreCountMin": 1,
        "pCoreCountMax": len(P_CORE_CPU_GROUPS),
        "eCoreCount": e_core_count,
        "eCoreCountMin": 0,
        "eCoreCountMax": len(E_CORE_CPUS),
        "pCoreGroups": [list(group) for group in P_CORE_CPU_GROUPS],
        "eCoreCPUs": list(E_CORE_CPUS),
        "pCoreOnlineCPUs": sorted(online & {cpu for group in P_CORE_CPU_GROUPS for cpu in group}),
        "eCoreOnlineCPUs": sorted(online & set(E_CORE_CPUS)),
        "pCoreFrequencyError": preference_error,
        "eCoreFrequencyError": preference_error,
    }

    try:
        state.update(_cluster_frequency_state(
            "p", tuple(cpu for group in P_CORE_CPU_GROUPS for cpu in group),
            P_CORE_FREQUENCY_FALLBACK_MAX_MHZ, preferences,
        ))
        state.update(_cluster_frequency_state(
            "e", E_CORE_CPUS, E_CORE_FREQUENCY_FALLBACK_MAX_MHZ, preferences,
        ))
    except CPUControlError as exc:
        state["pCoreFrequencySupported"] = False
        state["eCoreFrequencySupported"] = False
        state["pCoreFrequencyError"] = str(exc)
        state["eCoreFrequencyError"] = str(exc)
    if preference_error:
        state["pCoreFrequencySupported"] = False
        state["eCoreFrequencySupported"] = False
    return state


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
    original_online = _online_cpu_ids()
    _validate_core_control_layout(original_online)
    original_online_set = set(original_online)
    active_p_groups = [group for group in P_CORE_CPU_GROUPS if set(group) & original_online_set]
    active_e_cpus = [cpu_id for cpu_id in E_CORE_CPUS if cpu_id in original_online_set]
    desired_online = _online_ids_for_core_groups(active_p_groups, active_e_cpus, enabled)
    try:
        _write_and_verify(SMT_CONTROL_PATH, "on" if enabled else "off", "SMT")
        _apply_online_cpu_ids(desired_online)
        _validate_core_control_layout(desired_online)
        _apply_saved_frequency_limits()
    except Exception as exc:
        rollback_errors = _restore_cpu_topology(original_online, current)
        suffix = "" if not rollback_errors else " Rollback errors: " + "; ".join(rollback_errors)
        if isinstance(exc, CPUControlError):
            raise CPUControlError(f"Could not change SMT: {exc}.{suffix}") from exc
        raise CPUControlError(f"Could not change SMT: {exc}.{suffix}") from exc
    return get_cpu_control_state()


def set_cpu_core_counts(p_core_count: int, e_core_count: int) -> Dict[str, object]:
    """Set physical P/E core counts using the verified Claw A1M CPU map."""
    if isinstance(p_core_count, bool) or not isinstance(p_core_count, int):
        raise CPUControlError("P-core count must be an integer from 1 to 4.")
    if isinstance(e_core_count, bool) or not isinstance(e_core_count, int):
        raise CPUControlError("E-core count must be an integer from 0 to 4.")
    if not 1 <= p_core_count <= len(P_CORE_CPU_GROUPS):
        raise CPUControlError("P-core count must be between 1 and 4; CPU 0 keeps P-core 1 online.")
    if not 0 <= e_core_count <= len(E_CORE_CPUS):
        raise CPUControlError("E-core count must be between 0 and 4.")

    _ensure_supported_device()
    _validate_core_control_layout()
    if not SMT_CONTROL_PATH.exists():
        raise CPUControlError(f"SMT state is unavailable at {SMT_CONTROL_PATH}.")
    original_smt_mode = _read_text(SMT_CONTROL_PATH)
    original_online = _online_cpu_ids()
    smt_enabled = original_smt_mode == "on"
    desired_online = _online_ids_for_core_counts(p_core_count, e_core_count, smt_enabled)

    try:
        _apply_online_cpu_ids(desired_online)
        actual_online = set(_online_cpu_ids())
        expected_online = set(desired_online)
        if actual_online != expected_online:
            raise CPUControlError(
                f"Requested CPU set {sorted(expected_online)} but the kernel reports {sorted(actual_online)} online."
            )
        _validate_core_control_layout(actual_online)
        _apply_saved_frequency_limits()
    except Exception as exc:
        rollback_errors = _restore_cpu_topology(original_online, original_smt_mode)
        suffix = "" if not rollback_errors else " Rollback errors: " + "; ".join(rollback_errors)
        raise CPUControlError(f"Could not apply P/E core counts: {exc}.{suffix}") from exc

    return get_cpu_control_state()


def set_cpu_cluster_frequency_limit(core_type: str, frequency_mhz: int) -> Dict[str, object]:
    """Set and persist a P-core or E-core maximum frequency in MHz."""
    if not isinstance(core_type, str) or core_type not in {"p", "e"}:
        raise CPUControlError("CPU core type must be 'p' or 'e'.")
    if isinstance(frequency_mhz, bool) or not isinstance(frequency_mhz, int):
        raise CPUControlError("CPU frequency limit must be an integer number of MHz.")

    _ensure_supported_device()
    _validate_core_control_layout()
    if core_type == "p":
        key = "pCoreMaxFreqMhz"
        cpu_ids = tuple(cpu for group in P_CORE_CPU_GROUPS for cpu in group)
        fallback_max_mhz = P_CORE_FREQUENCY_FALLBACK_MAX_MHZ
    else:
        key = "eCoreMaxFreqMhz"
        cpu_ids = E_CORE_CPUS
        fallback_max_mhz = E_CORE_FREQUENCY_FALLBACK_MAX_MHZ

    paths = _frequency_policy_paths(cpu_ids)
    if not paths and set(cpu_ids) & set(_online_cpu_ids()):
        raise CPUControlError(f"No CPUFreq maximum-frequency policy is available for online {core_type.upper()} cores.")
    minimum_mhz, maximum_mhz = _frequency_policy_bounds(paths, fallback_max_mhz)
    if not minimum_mhz <= frequency_mhz <= maximum_mhz:
        raise CPUControlError(
            f"{core_type.upper()}-core frequency limit must be between {minimum_mhz} and {maximum_mhz} MHz."
        )

    previous = _write_cluster_frequency_limit(cpu_ids, frequency_mhz, fallback_max_mhz)
    try:
        _save_cpu_preference(key, frequency_mhz)
    except CPUControlError as exc:
        for path, old_value in reversed(previous):
            try:
                _write_and_verify(path, old_value, f"CPU frequency rollback {path}")
            except CPUControlError:
                pass
        raise exc
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
