"""Per-game handheld and docked profiles for the Claw A1M controls."""

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

from cpu_control import (
    CPUControlError,
    get_cpu_control_state,
    set_cpu_boost,
    set_cpu_cluster_frequency_limit,
    set_cpu_core_counts,
    set_cpu_governor,
    set_smt,
)
from gpu_control import (
    GPUFrequencyError,
    get_gpu_state,
    get_package_power_state,
    restore_automatic_frequency,
    set_fixed_frequency,
    set_package_tdp,
)


PROFILE_MODES = {"handheld", "docked"}
PROFILE_SCHEMA_VERSION = 1


class ProfileControlError(RuntimeError):
    """Raised when a game profile is invalid or cannot be stored/applied."""


def _profiles_path() -> Path:
    settings_dir = os.environ.get("DECKY_PLUGIN_SETTINGS_DIR")
    if not settings_dir:
        decky_home = Path(os.environ.get("DECKY_HOME", "/home/deck/homebrew"))
        settings_dir = str(decky_home / "settings" / "ClawGPUFrequency")
    return Path(settings_dir) / "game-profiles.json"


def _normalize_app_id(app_id: int) -> int:
    if isinstance(app_id, bool) or not isinstance(app_id, int) or app_id <= 0:
        raise ProfileControlError("A positive Steam app ID is required for game profiles.")
    return app_id


def _normalize_mode(mode: str) -> str:
    if not isinstance(mode, str) or mode not in PROFILE_MODES:
        raise ProfileControlError("Profile mode must be 'handheld' or 'docked'.")
    return mode


def _load_store() -> Dict[str, Any]:
    path = _profiles_path()
    if not path.exists():
        return {"schemaVersion": PROFILE_SCHEMA_VERSION, "games": {}}
    try:
        store = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ProfileControlError(f"Cannot read game profiles at {path}: {exc}") from exc
    if (
        not isinstance(store, dict)
        or store.get("schemaVersion") != PROFILE_SCHEMA_VERSION
        or not isinstance(store.get("games"), dict)
    ):
        raise ProfileControlError(f"Game profile data at {path} has an unsupported format.")
    return store


def _save_store(store: Dict[str, Any]) -> None:
    path = _profiles_path()
    temporary_path = path.with_suffix(".tmp")
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path.write_text(
            json.dumps(store, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        temporary_path.replace(path)
    except OSError as exc:
        raise ProfileControlError(f"Cannot save game profiles at {path}: {exc}") from exc


def _public_game_profiles(app_id: int) -> Dict[str, Any]:
    store = _load_store()
    game = store["games"].get(str(app_id), {})
    saved_profiles = game.get("profiles", {}) if isinstance(game, dict) else {}
    if not isinstance(saved_profiles, dict):
        saved_profiles = {}
    profiles = {
        mode: saved_profiles.get(mode)
        if isinstance(saved_profiles.get(mode), dict)
        and isinstance(saved_profiles[mode].get("settings"), dict)
        else None
        for mode in ("handheld", "docked")
    }
    return {
        "appId": app_id,
        "gameName": game.get("gameName", f"Steam app {app_id}") if isinstance(game, dict) else f"Steam app {app_id}",
        "lastMode": game.get("lastMode") if isinstance(game, dict) and game.get("lastMode") in PROFILE_MODES else None,
        "profiles": profiles,
    }


def _store_last_mode(app_id: int, mode: str) -> None:
    """Remember the last successfully applied or saved mode for one game."""
    store = _load_store()
    game_key = str(app_id)
    game = store["games"].get(game_key)
    if not isinstance(game, dict):
        game = {"profiles": {}}
    game["lastMode"] = mode
    store["games"][game_key] = game
    _save_store(store)


def get_game_profiles(app_id: int) -> Dict[str, Any]:
    """Return the two saved slots for one Steam app without changing hardware."""
    normalized_app_id = _normalize_app_id(app_id)
    return _public_game_profiles(normalized_app_id)


def _capture_current_settings() -> Dict[str, Any]:
    try:
        gpu = get_gpu_state()
        power = get_package_power_state()
        cpu = get_cpu_control_state()
    except (CPUControlError, GPUFrequencyError) as exc:
        raise ProfileControlError(f"Cannot capture the current Claw settings: {exc}") from exc

    minimum = gpu.get("minFreqMhz")
    maximum = gpu.get("maxFreqMhz")
    if not isinstance(minimum, int) or not isinstance(maximum, int):
        raise ProfileControlError("GPU frequency limits are unavailable; profile was not saved.")
    gpu_is_fixed = minimum == maximum

    def optional_int(value: Any) -> Optional[int]:
        return value if isinstance(value, int) and not isinstance(value, bool) else None

    def optional_bool(value: Any) -> Optional[bool]:
        return value if isinstance(value, bool) else None

    return {
        "gpu": {
            "automatic": not gpu_is_fixed,
            "frequencyMhz": minimum if gpu_is_fixed else None,
        },
        "packageTdpW": int(power["currentTdpW"]),
        "cpu": {
            "boostEnabled": optional_bool(cpu.get("cpuBoostEnabled")),
            "smtEnabled": optional_bool(cpu.get("smtEnabled")),
            "pCoreCount": optional_int(cpu.get("pCoreCount")),
            "eCoreCount": optional_int(cpu.get("eCoreCount")),
            "pCoreMaxFrequencyMhz": optional_int(
                cpu.get("pCoreFrequencyTargetMhz")
                if cpu.get("pCoreFrequencySupported")
                else None
            ),
            "eCoreMaxFrequencyMhz": optional_int(
                cpu.get("eCoreFrequencyTargetMhz")
                if cpu.get("eCoreFrequencySupported")
                else None
            ),
            "governor": cpu.get("currentGovernor")
            if cpu.get("governorSupported") and not cpu.get("governorMixed")
            else None,
        },
    }


def save_game_profile(app_id: int, game_name: str, mode: str) -> Dict[str, Any]:
    """Save the current applied controls into one game's selected mode slot."""
    normalized_app_id = _normalize_app_id(app_id)
    normalized_mode = _normalize_mode(mode)
    if not isinstance(game_name, str):
        raise ProfileControlError("Game name must be text.")
    normalized_name = game_name.strip()[:160] or f"Steam app {normalized_app_id}"

    profile = {
        "savedAt": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "settings": _capture_current_settings(),
    }
    store = _load_store()
    game_key = str(normalized_app_id)
    game = store["games"].get(game_key)
    if not isinstance(game, dict):
        game = {"profiles": {}}
    profiles = game.get("profiles")
    if not isinstance(profiles, dict):
        profiles = {}
    profiles[normalized_mode] = profile
    game["gameName"] = normalized_name
    game["profiles"] = profiles
    game["lastMode"] = normalized_mode
    store["games"][game_key] = game
    _save_store(store)
    return _public_game_profiles(normalized_app_id)


def _require_int(value: Any, label: str, allow_none: bool = False) -> Optional[int]:
    if value is None and allow_none:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ProfileControlError(f"Saved profile has an invalid {label} value.")
    return value


def _require_optional_bool(value: Any, label: str) -> Optional[bool]:
    if value is None:
        return None
    if not isinstance(value, bool):
        raise ProfileControlError(f"Saved profile has an invalid {label} value.")
    return value


def _read_profile_for_apply(app_id: int, mode: str) -> Dict[str, Any]:
    profile = _public_game_profiles(app_id)["profiles"][mode]
    if not isinstance(profile, dict) or not isinstance(profile.get("settings"), dict):
        raise ProfileControlError(f"No {mode} profile has been saved for this game.")
    settings = profile["settings"]
    gpu = settings.get("gpu")
    cpu = settings.get("cpu")
    if not isinstance(gpu, dict) or not isinstance(cpu, dict):
        raise ProfileControlError("Saved profile is missing GPU or CPU settings.")
    if not isinstance(gpu.get("automatic"), bool):
        raise ProfileControlError("Saved profile has an invalid GPU frequency mode.")
    if not gpu["automatic"]:
        _require_int(gpu.get("frequencyMhz"), "GPU frequency")
    _require_int(settings.get("packageTdpW"), "package TDP")
    _require_optional_bool(cpu.get("boostEnabled"), "CPU Boost")
    _require_optional_bool(cpu.get("smtEnabled"), "SMT")
    _require_int(cpu.get("pCoreCount"), "P-core count", allow_none=True)
    _require_int(cpu.get("eCoreCount"), "E-core count", allow_none=True)
    _require_int(cpu.get("pCoreMaxFrequencyMhz"), "P-core frequency", allow_none=True)
    _require_int(cpu.get("eCoreMaxFrequencyMhz"), "E-core frequency", allow_none=True)
    governor = cpu.get("governor")
    if governor is not None and not isinstance(governor, str):
        raise ProfileControlError("Saved profile has an invalid CPU governor value.")
    return settings


def apply_game_profile(app_id: int, mode: str) -> Dict[str, Any]:
    """Apply one saved profile and return the resulting live control states."""
    normalized_app_id = _normalize_app_id(app_id)
    normalized_mode = _normalize_mode(mode)
    settings = _read_profile_for_apply(normalized_app_id, normalized_mode)
    gpu = settings["gpu"]
    cpu = settings["cpu"]
    applied = []

    def run(label: str, operation: Any) -> None:
        try:
            operation()
        except Exception as exc:
            completed = ", ".join(applied) or "none"
            raise ProfileControlError(f"{label} failed after applying {completed}: {exc}") from exc
        applied.append(label)

    if cpu["boostEnabled"] is not None:
        run("CPU Boost", lambda: set_cpu_boost(cpu["boostEnabled"]))
    if cpu["smtEnabled"] is not None:
        run("SMT", lambda: set_smt(cpu["smtEnabled"]))
    p_core_count = cpu["pCoreCount"]
    e_core_count = cpu["eCoreCount"]
    if p_core_count is not None and e_core_count is not None:
        run("P/E core counts", lambda: set_cpu_core_counts(p_core_count, e_core_count))
    if cpu["pCoreMaxFrequencyMhz"] is not None:
        run(
            "P-core frequency limit",
            lambda: set_cpu_cluster_frequency_limit("p", cpu["pCoreMaxFrequencyMhz"]),
        )
    if cpu["eCoreMaxFrequencyMhz"] is not None:
        run(
            "E-core frequency limit",
            lambda: set_cpu_cluster_frequency_limit("e", cpu["eCoreMaxFrequencyMhz"]),
        )
    if cpu["governor"] is not None:
        run("CPU governor", lambda: set_cpu_governor(cpu["governor"]))

    run("Package TDP", lambda: set_package_tdp(settings["packageTdpW"]))
    if gpu["automatic"]:
        run("GPU automatic frequency", restore_automatic_frequency)
    else:
        run("GPU frequency", lambda: set_fixed_frequency(gpu["frequencyMhz"]))

    result = {
        "applied": applied,
        "gpuState": get_gpu_state(),
        "packagePowerState": get_package_power_state(),
        "cpuState": get_cpu_control_state(),
    }
    _store_last_mode(normalized_app_id, normalized_mode)
    return result
