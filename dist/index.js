const manifest = {"name":"Claw GPU Frequency"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: true, configurable: true, writable: true }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaMicrochip (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M416 48v416c0 26.51-21.49 48-48 48H144c-26.51 0-48-21.49-48-48V48c0-26.51 21.49-48 48-48h224c26.51 0 48 21.49 48 48zm96 58v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42V88h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zm0 96v12a6 6 0 0 1-6 6h-18v6a6 6 0 0 1-6 6h-42v-48h42a6 6 0 0 1 6 6v6h18a6 6 0 0 1 6 6zM30 376h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6zm0-96h42v48H30a6 6 0 0 1-6-6v-6H6a6 6 0 0 1-6-6v-12a6 6 0 0 1 6-6h18v-6a6 6 0 0 1 6-6z"},"child":[]}]})(props);
}

const PROFILE_MODE_STORAGE_KEY = "claw-gpu-frequency.profile-mode";
function readSavedProfileMode() {
    try {
        const savedMode = window.localStorage.getItem(PROFILE_MODE_STORAGE_KEY);
        return savedMode === "docked" || savedMode === "customize" ? savedMode : "handheld";
    }
    catch {
        return "handheld";
    }
}
function saveProfileModePreference(mode) {
    try {
        window.localStorage.setItem(PROFILE_MODE_STORAGE_KEY, mode);
        return true;
    }
    catch {
        return false;
    }
}
const getGPUState = callable("get_gpu_state");
const setGPUFrequency = callable("set_gpu_frequency");
const restoreAutomatic = callable("restore_gpu_automatic");
const getPackagePowerState = callable("get_package_power_state");
const setPackageTDP = callable("set_package_tdp");
const getCPUControlState = callable("get_cpu_control_state");
const setCPUBoost = callable("set_cpu_boost");
const setSMT = callable("set_smt");
const setCPUGovernor = callable("set_cpu_governor");
const setCPUCoreCounts = callable("set_cpu_core_counts");
const setCPUClusterFrequencyLimit = callable("set_cpu_cluster_frequency_limit");
const getGameProfiles = callable("get_game_profiles");
const saveGameProfile = callable("save_game_profile");
const applyGameProfile = callable("apply_game_profile");
const THROTTLE_LABELS = {
    pl1: "整机封装功耗限制（PL1）",
    pl2: "短时封装功耗限制（PL2）",
    pl4: "瞬时功耗限制（PL4）",
    thermal: "温度限制",
    prochot: "PROCHOT 温度/功耗限制",
    ratl: "温度/功耗算法限制（RATL）",
    vr_thermalert: "电压调节器温度限制",
    vr_tdc: "电流限制",
};
function formatFrequencyRange(minMhz, maxMhz) {
    if (minMhz == null || maxMhz == null)
        return "暂无读数";
    return minMhz === maxMhz ? `${minMhz} MHz` : `${minMhz}–${maxMhz} MHz`;
}
function formatProfileSummary(profile) {
    if (!profile)
        return "未保存";
    const settings = profile.settings;
    if (!settings?.gpu || !settings.cpu || typeof settings.packageTdpW !== "number") {
        return "Profile 数据无效";
    }
    const { gpu, packageTdpW, cpu } = settings;
    const gpuText = gpu.automatic ? "GPU 自动" : `GPU ${gpu.frequencyMhz ?? "—"} MHz`;
    const coreText = cpu.pCoreCount == null || cpu.eCoreCount == null
        ? "核心配置未读"
        : `P${cpu.pCoreCount}/4 · E${cpu.eCoreCount}/4`;
    return `${gpuText} · ${packageTdpW} W · ${coreText}`;
}
function profileModeLabel(mode) {
    if (mode === "handheld")
        return "掌机模式";
    if (mode === "docked")
        return "主机模式";
    return "Customize";
}
function profileMatchesCurrentSettings(profile, gpu, power, cpu) {
    const settings = profile.settings;
    if (gpu.supported && typeof gpu.minFreqMhz === "number" && typeof gpu.maxFreqMhz === "number") {
        const automatic = gpu.minFreqMhz !== gpu.maxFreqMhz;
        if (settings.gpu.automatic !== automatic)
            return false;
        if (!automatic && settings.gpu.frequencyMhz !== gpu.minFreqMhz)
            return false;
    }
    if (power.supported && settings.packageTdpW !== power.currentTdpW)
        return false;
    const optionalMatches = (expected, actual) => expected === null || expected === actual;
    const expectedCPU = settings.cpu;
    if (!optionalMatches(expectedCPU.boostEnabled, cpu.cpuBoostEnabled))
        return false;
    if (!optionalMatches(expectedCPU.smtEnabled, cpu.smtEnabled))
        return false;
    if (!optionalMatches(expectedCPU.pCoreCount, cpu.pCoreCount))
        return false;
    if (!optionalMatches(expectedCPU.eCoreCount, cpu.eCoreCount))
        return false;
    if (!optionalMatches(expectedCPU.pCoreMaxFrequencyMhz, cpu.pCoreFrequencyTargetMhz))
        return false;
    if (!optionalMatches(expectedCPU.eCoreMaxFrequencyMhz, cpu.eCoreFrequencyTargetMhz))
        return false;
    if (expectedCPU.governor !== null) {
        if (cpu.governorMixed || expectedCPU.governor !== cpu.currentGovernor)
            return false;
    }
    return true;
}
function GPUFrequencyPanel() {
    const [state, setState] = SP_REACT.useState(null);
    const [powerState, setPowerState] = SP_REACT.useState(null);
    const [cpuState, setCPUState] = SP_REACT.useState(null);
    const [targetMhz, setTargetMhz] = SP_REACT.useState(null);
    const [targetTdpW, setTargetTdpW] = SP_REACT.useState(null);
    const [targetPCoreCount, setTargetPCoreCount] = SP_REACT.useState(null);
    const [targetECoreCount, setTargetECoreCount] = SP_REACT.useState(null);
    const [targetPCoreFrequencyMhz, setTargetPCoreFrequencyMhz] = SP_REACT.useState(null);
    const [targetECoreFrequencyMhz, setTargetECoreFrequencyMhz] = SP_REACT.useState(null);
    const [activeGame, setActiveGame] = SP_REACT.useState(null);
    const [profileMode, setProfileMode] = SP_REACT.useState(readSavedProfileMode);
    const [gameProfiles, setGameProfiles] = SP_REACT.useState(null);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [message, setMessage] = SP_REACT.useState("");
    const targetInitialized = SP_REACT.useRef(false);
    const powerTargetInitialized = SP_REACT.useRef(false);
    const coreTargetsInitialized = SP_REACT.useRef(false);
    SP_REACT.useEffect(() => {
        let mounted = true;
        const detectActiveGame = () => {
            let nextGame = null;
            try {
                const appId = window.SteamUIStore?.MainRunningAppID;
                if (typeof appId === "number" && Number.isSafeInteger(appId) && appId > 0) {
                    const runningApp = window.SteamUIStore?.MainRunningApp;
                    const overview = window.appStore?.GetAppOverviewByAppID(appId);
                    nextGame = {
                        appId,
                        name: runningApp?.display_name || overview?.display_name || `Steam app ${appId}`,
                    };
                }
            }
            catch {
                nextGame = null;
            }
            if (!mounted)
                return;
            setActiveGame((current) => (current?.appId === nextGame?.appId && current?.name === nextGame?.name
                ? current
                : nextGame));
        };
        detectActiveGame();
        const timer = window.setInterval(detectActiveGame, 1500);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);
    SP_REACT.useEffect(() => {
        let mounted = true;
        if (!activeGame) {
            setGameProfiles(null);
            return () => {
                mounted = false;
            };
        }
        setGameProfiles(null);
        void getGameProfiles(activeGame.appId)
            .then((next) => {
            if (mounted)
                setGameProfiles(next);
        })
            .catch((error) => {
            if (mounted) {
                setGameProfiles({
                    supported: false,
                    appId: activeGame.appId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
        return () => {
            mounted = false;
        };
    }, [activeGame?.appId]);
    SP_REACT.useEffect(() => {
        let mounted = true;
        const refresh = async () => {
            const [gpuResult, powerResult, cpuResult] = await Promise.allSettled([
                getGPUState(),
                getPackagePowerState(),
                getCPUControlState(),
            ]);
            if (!mounted)
                return;
            if (gpuResult.status === "fulfilled") {
                const next = gpuResult.value;
                setState(next);
                if (next.supported && !targetInitialized.current) {
                    const initial = next.minFreqMhz === next.maxFreqMhz
                        ? next.minFreqMhz
                        : next.maxFreqMhz;
                    setTargetMhz(initial ?? next.hwMaxFreqMhz ?? 0);
                    targetInitialized.current = true;
                }
            }
            else {
                const error = gpuResult.reason;
                setState({ supported: false, error: error instanceof Error ? error.message : String(error) });
            }
            if (powerResult.status === "fulfilled") {
                const next = powerResult.value;
                setPowerState(next);
                if (next.supported && !powerTargetInitialized.current) {
                    setTargetTdpW(next.currentTdpW ?? next.minTdpW ?? 5);
                    powerTargetInitialized.current = true;
                }
            }
            else {
                const error = powerResult.reason;
                setPowerState({ supported: false, error: error instanceof Error ? error.message : String(error) });
            }
            if (cpuResult.status === "fulfilled") {
                const next = cpuResult.value;
                setCPUState(next);
                if (next.coreControlSupported && !coreTargetsInitialized.current) {
                    setTargetPCoreCount(next.pCoreCount ?? 1);
                    setTargetECoreCount(next.eCoreCount ?? 0);
                    setTargetPCoreFrequencyMhz(next.pCoreFrequencyTargetMhz
                        ?? next.pCoreFrequencyMaxMhz
                        ?? 4600);
                    setTargetECoreFrequencyMhz(next.eCoreFrequencyTargetMhz
                        ?? next.eCoreFrequencyMaxMhz
                        ?? 3600);
                    coreTargetsInitialized.current = true;
                }
            }
            else {
                const error = cpuResult.reason;
                setCPUState({ supported: false, error: error instanceof Error ? error.message : String(error) });
            }
        };
        void refresh();
        const timer = window.setInterval(() => void refresh(), 2000);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);
    SP_REACT.useEffect(() => {
        if (busy || profileMode === "customize" || !activeGame)
            return;
        const profiles = gameProfiles?.appId === activeGame.appId ? gameProfiles : null;
        if (!profiles || profiles.supported === false)
            return;
        const profile = profiles.profiles?.[profileMode];
        if (!profile) {
            setProfileMode("customize");
            saveProfileModePreference("customize");
            setMessage(`尚未保存${profileModeLabel(profileMode)} Profile；当前处于 Customize`);
            return;
        }
        if (!state || !powerState || !cpuState)
            return;
        if (!profileMatchesCurrentSettings(profile, state, powerState, cpuState)) {
            setProfileMode("customize");
            saveProfileModePreference("customize");
            setMessage(`当前设置与${profileModeLabel(profileMode)} Profile 不一致，已切换为 Customize`);
        }
    }, [activeGame?.appId, busy, cpuState, gameProfiles, powerState, profileMode, state]);
    const apply = async (action, successMessage) => {
        setBusy(true);
        setMessage("");
        try {
            const next = await action();
            setState(next);
            if (next.supported) {
                const nextTarget = next.minFreqMhz === next.maxFreqMhz
                    ? next.minFreqMhz
                    : next.maxFreqMhz;
                setTargetMhz(nextTarget ?? null);
                targetInitialized.current = true;
            }
            setMessage(successMessage);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const applyPackageTDP = async () => {
        if (targetTdpW == null)
            return;
        setBusy(true);
        setMessage("");
        try {
            const next = await setPackageTDP(targetTdpW);
            setPowerState(next);
            setTargetTdpW(next.currentTdpW ?? targetTdpW);
            setMessage(`MSR + MMIO 的 PL1/PL2 已同步为 ${next.currentTdpW ?? targetTdpW} W`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const applyCPUControl = async (action, successMessage) => {
        setBusy(true);
        setMessage("");
        try {
            const next = await action();
            setCPUState(next);
            setMessage(successMessage);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const applyCPUCoreCounts = async () => {
        if (targetPCoreCount == null || targetECoreCount == null)
            return;
        setBusy(true);
        setMessage("");
        try {
            const next = await setCPUCoreCounts(targetPCoreCount, targetECoreCount);
            setCPUState(next);
            setTargetPCoreCount(next.pCoreCount ?? targetPCoreCount);
            setTargetECoreCount(next.eCoreCount ?? targetECoreCount);
            if (next.pCoreFrequencyTargetMhz != null) {
                setTargetPCoreFrequencyMhz(next.pCoreFrequencyTargetMhz);
            }
            if (next.eCoreFrequencyTargetMhz != null) {
                setTargetECoreFrequencyMhz(next.eCoreFrequencyTargetMhz);
            }
            setMessage(`已应用：P 核 ${next.pCoreCount}/4，E 核 ${next.eCoreCount}/4`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const applyCPUFrequencyLimit = async (coreType) => {
        const frequencyMhz = coreType === "p" ? targetPCoreFrequencyMhz : targetECoreFrequencyMhz;
        if (frequencyMhz == null)
            return;
        setBusy(true);
        setMessage("");
        try {
            const next = await setCPUClusterFrequencyLimit(coreType, frequencyMhz);
            setCPUState(next);
            const activePolicies = coreType === "p"
                ? next.pCoreFrequencyOnlinePolicies ?? 0
                : next.eCoreFrequencyOnlinePolicies ?? 0;
            setMessage(activePolicies > 0
                ? `已设定 ${coreType.toUpperCase()} 核最高频率 ${frequencyMhz} MHz（${activePolicies} 个在线策略）`
                : `${coreType.toUpperCase()} 核最高频率 ${frequencyMhz} MHz 已保存，核心上线时应用`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const syncAppliedProfileState = (next) => {
        setState(next.gpuState);
        setPowerState(next.packagePowerState);
        setCPUState(next.cpuState);
        setTargetMhz(next.gpuState.minFreqMhz === next.gpuState.maxFreqMhz
            ? next.gpuState.minFreqMhz ?? null
            : next.gpuState.maxFreqMhz ?? null);
        setTargetTdpW(next.packagePowerState.currentTdpW ?? null);
        setTargetPCoreCount(next.cpuState.pCoreCount ?? null);
        setTargetECoreCount(next.cpuState.eCoreCount ?? null);
        setTargetPCoreFrequencyMhz(next.cpuState.pCoreFrequencyTargetMhz ?? null);
        setTargetECoreFrequencyMhz(next.cpuState.eCoreFrequencyTargetMhz ?? null);
        targetInitialized.current = true;
        powerTargetInitialized.current = true;
        coreTargetsInitialized.current = true;
    };
    const selectProfileMode = async (mode) => {
        if (mode === "customize") {
            setProfileMode(mode);
            saveProfileModePreference(mode);
            setMessage("当前为 Customize；可将当前设置覆盖到掌机或主机 Profile");
            return;
        }
        if (!activeGame)
            return;
        const profiles = gameProfiles?.appId === activeGame.appId ? gameProfiles : null;
        if (!profiles || profiles.supported === false)
            return;
        const game = activeGame;
        if (!profiles.profiles?.[mode]) {
            setProfileMode("customize");
            saveProfileModePreference("customize");
            setMessage(`尚未保存${profileModeLabel(mode)} Profile；当前设置未更改，可在 Customize 中覆盖保存`);
            return;
        }
        setBusy(true);
        setMessage("");
        try {
            const next = await applyGameProfile(game.appId, mode);
            syncAppliedProfileState(next);
            setProfileMode(mode);
            saveProfileModePreference(mode);
            setMessage(`已应用 ${game.name} 的${profileModeLabel(mode)}配置：${next.applied.join("、")}`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const overwriteGameProfile = async (mode, game) => {
        setBusy(true);
        setMessage("");
        try {
            const next = await saveGameProfile(game.appId, game.name, mode);
            if (next.supported === false)
                throw new Error(next.error ?? "无法覆盖游戏配置");
            setGameProfiles(next);
            setProfileMode(mode);
            saveProfileModePreference(mode);
            setMessage(`已将当前设置保存到 ${game.name} 的${profileModeLabel(mode)} Profile`);
        }
        catch (error) {
            setMessage(error instanceof Error ? error.message : String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const confirmOverwriteGameProfile = (mode) => {
        if (!activeGame || profileMode !== "customize")
            return;
        const game = activeGame;
        const label = profileModeLabel(mode);
        let modal;
        modal = DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: `覆盖${label} Profile？`, strDescription: `将用当前已生效设置覆盖 ${game.name} 的${label} Profile。原 Profile 内容会被替换。`, strOKButtonText: "\u786E\u8BA4\u8986\u76D6", strCancelButtonText: "\u53D6\u6D88", bDestructiveWarning: true, onCancel: () => modal?.Close(), onOK: () => {
                modal?.Close();
                void overwriteGameProfile(mode, game);
            } }));
    };
    const supported = state?.supported === true;
    const currentGameProfiles = gameProfiles?.appId === activeGame?.appId ? gameProfiles : null;
    const availableGovernors = cpuState?.availableGovernors ?? [];
    const governorToggleSupported = cpuState?.governorSupported === true
        && availableGovernors.includes("performance")
        && availableGovernors.includes("powersave");
    const governorToggleDescription = !governorToggleSupported
        ? "不可用"
        : cpuState?.governorMixed
            ? "策略混合"
            : cpuState?.currentGovernor === "performance"
                ? "Performance"
                : cpuState?.currentGovernor === "powersave"
                    ? "Power Save"
                    : cpuState?.currentGovernor ?? "未知";
    const actualText = !supported
        ? "—"
        : state.actualFreqMhz == null
            ? "空闲 / 暂无读数"
            : `${state.actualFreqMhz} MHz`;
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "GPU Frequency", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { className: DFL.staticClasses.PanelSectionTitle, children: ["GPU \u5B9E\u9645\u9891\u7387\uFF1A", actualText] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { className: DFL.staticClasses.PanelSectionTitle, children: "\u6E38\u620F Profile" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: activeGame
                        ? `${activeGame.name} · AppID ${activeGame.appId}`
                        : "未检测到运行中的 Steam 游戏" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.DropdownItem, { label: "\u914D\u7F6E\u6A21\u5F0F", description: profileModeLabel(profileMode), rgOptions: [
                        { data: "handheld", label: "掌机模式" },
                        { data: "docked", label: "主机模式" },
                        { data: "customize", label: "Customize" },
                    ], selectedOption: profileMode, disabled: busy || !activeGame || !currentGameProfiles || currentGameProfiles.supported === false, onChange: (option) => {
                        const selectedMode = option?.data;
                        if (selectedMode === "handheld" || selectedMode === "docked" || selectedMode === "customize") {
                            void selectProfileMode(selectedMode);
                        }
                    } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u638C\u673A\uFF1A", activeGame && !currentGameProfiles
                            ? "读取中…"
                            : formatProfileSummary(currentGameProfiles?.profiles?.handheld)] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u4E3B\u673A\uFF1A", activeGame && !currentGameProfiles
                            ? "读取中…"
                            : formatProfileSummary(currentGameProfiles?.profiles?.docked)] }) }), currentGameProfiles?.supported === false && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: currentGameProfiles.error ?? "游戏 Profile 存储不可用" }) })), profileMode === "customize" && (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || !activeGame || !currentGameProfiles || currentGameProfiles.supported === false, onClick: () => confirmOverwriteGameProfile("handheld"), children: "\u8986\u76D6\u638C\u673A\u6A21\u5F0F Profile" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || !activeGame || !currentGameProfiles || currentGameProfiles.supported === false, onClick: () => confirmOverwriteGameProfile("docked"), children: "\u8986\u76D6\u4E3B\u673A\u6A21\u5F0F Profile" }) })] })), supported ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u9891\u7387\u9650\u5236\uFF1A", state.minFreqMhz, "\u2013", state.maxFreqMhz, " MHz \u00B7 Boost\uFF1A", state.boostFreqMhz, " MHz"] }) }), (state.requestedFreqMhz != null || state.firmwareRequestedFreqMhz != null) && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u9A71\u52A8\u8BF7\u6C42\uFF1A", state.requestedFreqMhz ?? "—", " MHz \u00B7 \u56FA\u4EF6\u8BF7\u6C42\uFF1A", state.firmwareRequestedFreqMhz ?? "—", " MHz"] }) })), state.throttled && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u56FA\u4EF6\u9650\u9891\uFF1A", state.throttleReasons?.length
                                    ? state.throttleReasons.map((reason) => THROTTLE_LABELS[reason] ?? reason).join("、")
                                    : "生效（原因暂不可读）"] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "\u76EE\u6807\u9891\u7387", description: `硬件范围 ${state.hwMinFreqMhz}–${state.hwMaxFreqMhz} MHz；调整后点“应用 GPU 频率”才写入驱动`, min: state.hwMinFreqMhz ?? 0, max: state.hwMaxFreqMhz ?? 0, step: state.stepMhz ?? 50, value: targetMhz ?? state.maxFreqMhz ?? 0, showValue: true, valueSuffix: " MHz", disabled: busy, onChange: (value) => setTargetMhz(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || targetMhz == null, onClick: () => targetMhz != null && void apply(() => setGPUFrequency(targetMhz), `已请求固定到 ${targetMhz} MHz`), children: "\u5E94\u7528 GPU \u9891\u7387" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy, onClick: () => void apply(restoreAutomatic, "已恢复自动频率范围"), children: "\u6062\u590D\u81EA\u52A8\u9891\u7387" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: "\u63D2\u4EF6\u53EA\u8BF7\u6C42 GPU \u9891\u7387\uFF1B\u6574\u673A\u529F\u8017\u6216\u6E29\u5EA6\u9650\u9891\u7531\u56FA\u4EF6\u63A7\u5236\uFF0C\u5B9E\u9645\u9891\u7387\u53EF\u80FD\u4F4E\u4E8E\u8BF7\u6C42\u503C\u3002" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { className: DFL.staticClasses.PanelSectionTitle, children: "\u6574\u673A TDP\uFF08MSR + MMIO\uFF09" }) }), powerState?.supported ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u5F53\u524D\u6709\u6548\u6574\u673A\u4E0A\u9650\uFF1A", powerState.currentTdpW, " W \u00B7 \u786C\u4EF6\u4E0A\u9650\uFF1A", powerState.maxTdpW, " W"] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "\u6574\u673A TDP", description: `范围 ${powerState.minTdpW}–${powerState.maxTdpW} W；应用后同步设置 MSR 与 MMIO 的 PL1、PL2`, min: powerState.minTdpW ?? 5, max: powerState.maxTdpW ?? 28, step: 1, value: targetTdpW ?? powerState.currentTdpW ?? powerState.minTdpW ?? 5, showValue: true, valueSuffix: " W", disabled: busy, onChange: (value) => setTargetTdpW(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || targetTdpW == null, onClick: () => void applyPackageTDP(), children: "\u5E94\u7528 TDP" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: "\u6B64\u9879\u4E3A CPU \u4E0E GPU \u8BBE\u7F6E\u5171\u4EAB\u7684\u6574\u673A\u529F\u8017\u76EE\u6807\uFF1B\u5E94\u7528\u65F6\u540C\u6B65\u5199\u5165 MSR \u548C MMIO\uFF0C\u4E0D\u4FEE\u6539 GPU \u9891\u7387\u3002" }) })] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: powerState?.error ?? "正在读取 MSR / MMIO RAPL 功耗状态…" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { className: DFL.staticClasses.PanelSectionTitle, children: "CPU Controls" }) }), cpuState?.supported ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [cpuState.coreControlSupported ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { className: DFL.staticClasses.PanelSectionTitle, children: "P/E \u6838\u5FC3\u6570\u91CF" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u5F53\u524D\u5728\u7EBF\uFF1AP \u6838 ", cpuState.pCoreCount, "/4 \u00B7 E \u6838 ", cpuState.eCoreCount, "/4 \u00B7 \u903B\u8F91 CPU ", cpuState.onlineCPUs ?? "—"] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "P \u6838\u6570\u91CF", description: "\u6309\u7269\u7406\u6838\u5FC3\u8BA1\u6570\uFF1BCPU 0 \u6240\u5728\u7684 P \u6838\u5FC5\u987B\u4FDD\u7559", min: cpuState.pCoreCountMin ?? 1, max: cpuState.pCoreCountMax ?? 4, step: 1, value: targetPCoreCount ?? cpuState.pCoreCount ?? 1, showValue: true, disabled: busy, onChange: (value) => setTargetPCoreCount(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "E \u6838\u6570\u91CF", description: "\u6309\u7269\u7406\u6838\u5FC3\u8BA1\u6570\uFF0C\u53EF\u8BBE\u4E3A 0\u20134", min: cpuState.eCoreCountMin ?? 0, max: cpuState.eCoreCountMax ?? 4, step: 1, value: targetECoreCount ?? cpuState.eCoreCount ?? 0, showValue: true, disabled: busy, onChange: (value) => setTargetECoreCount(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || targetPCoreCount == null || targetECoreCount == null, onClick: () => void applyCPUCoreCounts(), children: "\u5E94\u7528\u6838\u5FC3\u6570\u91CF" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { className: DFL.staticClasses.PanelSectionTitle, children: "P/E \u6838\u6700\u9AD8\u9891\u7387" }) }), cpuState.pCoreFrequencySupported ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "P \u6838\u6700\u9AD8\u9891\u7387", description: `范围 ${cpuState.pCoreFrequencyMinMhz}–${cpuState.pCoreFrequencyMaxMhz} MHz；应用后统一在线 P 核策略${cpuState.pCoreFrequencyMixed ? "（当前策略不一致）" : ""}`, min: cpuState.pCoreFrequencyMinMhz ?? 400, max: cpuState.pCoreFrequencyMaxMhz ?? 4600, step: 100, value: targetPCoreFrequencyMhz ?? cpuState.pCoreFrequencyMaxMhz ?? 4600, showValue: true, valueSuffix: " MHz", disabled: busy, onChange: (value) => setTargetPCoreFrequencyMhz(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u5F53\u524D P \u6838\u4E0A\u9650\uFF1A", cpuState.pCoreFrequencyCurrentMhz != null
                                                            ? `${cpuState.pCoreFrequencyCurrentMhz} MHz`
                                                            : cpuState.pCoreFrequencyMixed
                                                                ? "策略不一致"
                                                                : cpuState.pCoreFrequencyOnlinePolicies === 0
                                                                    ? "无在线策略"
                                                                    : "未读取"] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["P \u6838\u5F53\u524D CPUFreq \u8BFB\u6570\uFF1A", formatFrequencyRange(cpuState.pCoreActualFrequencyMinMhz, cpuState.pCoreActualFrequencyMaxMhz)] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || targetPCoreFrequencyMhz == null, onClick: () => void applyCPUFrequencyLimit("p"), children: "\u5E94\u7528 P \u6838\u9891\u7387" }) })] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: cpuState.pCoreFrequencyError ?? "P 核频率策略不可用" }) })), cpuState.eCoreFrequencySupported ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "E \u6838\u6700\u9AD8\u9891\u7387", description: `范围 ${cpuState.eCoreFrequencyMinMhz}–${cpuState.eCoreFrequencyMaxMhz} MHz；上限会保存，并在 E 核上线时应用`, min: cpuState.eCoreFrequencyMinMhz ?? 400, max: cpuState.eCoreFrequencyMaxMhz ?? 3600, step: 100, value: targetECoreFrequencyMhz ?? cpuState.eCoreFrequencyMaxMhz ?? 3600, showValue: true, valueSuffix: " MHz", disabled: busy, onChange: (value) => setTargetECoreFrequencyMhz(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u5F53\u524D E \u6838\u4E0A\u9650\uFF1A", cpuState.eCoreFrequencyCurrentMhz != null
                                                            ? `${cpuState.eCoreFrequencyCurrentMhz} MHz`
                                                            : cpuState.eCoreFrequencyMixed
                                                                ? "策略不一致"
                                                                : cpuState.eCoreFrequencyOnlinePolicies === 0
                                                                    ? "无在线策略"
                                                                    : "未读取"] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["E \u6838\u5F53\u524D CPUFreq \u8BFB\u6570\uFF1A", formatFrequencyRange(cpuState.eCoreActualFrequencyMinMhz, cpuState.eCoreActualFrequencyMaxMhz)] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || targetECoreFrequencyMhz == null, onClick: () => void applyCPUFrequencyLimit("e"), children: "\u5E94\u7528 E \u6838\u9891\u7387" }) })] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: cpuState.eCoreFrequencyError ?? "E 核频率策略不可用" }) }))] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: cpuState.coreControlError ?? "当前 CPU 拓扑不符合受支持的 Claw A1M 4P + 4E 映射" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "CPU Boost\uFF08Turbo\uFF09", description: cpuState.cpuBoostSupported
                                        ? (cpuState.cpuBoostEnabled ? "开启" : "关闭")
                                        : "不可用", checked: cpuState.cpuBoostEnabled ?? false, disabled: busy || !cpuState.cpuBoostSupported || cpuState.cpuBoostEnabled == null, onChange: (enabled) => void applyCPUControl(() => setCPUBoost(enabled), enabled ? "已启用 CPU Boost" : "已关闭 CPU Boost") }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "P \u6838 SMT\uFF08\u8D85\u7EBF\u7A0B\uFF09", description: !cpuState.coreControlSupported
                                        ? "当前 CPU 拓扑不支持分组控制"
                                        : cpuState.smtSupported
                                            ? (cpuState.smtEnabled ? "开启 · 在线 P 核启用双线程" : "关闭 · 在线 P 核各保留一个线程")
                                            : "不可切换", checked: cpuState.smtEnabled ?? false, disabled: busy || !cpuState.coreControlSupported || !cpuState.smtSupported || cpuState.smtEnabled == null, onChange: (enabled) => void applyCPUControl(() => setSMT(enabled), enabled ? "已启用 SMT（超线程）" : "已关闭 SMT（超线程）") }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: cpuState.governorSupported ? (SP_JSX.jsx(DFL.ToggleField, { label: "CPU \u8C03\u9891\u7B56\u7565", description: cpuState.governorError ?? governorToggleDescription, checked: cpuState.currentGovernor === "performance", disabled: busy || !governorToggleSupported, onChange: (enabled) => void applyCPUControl(() => setCPUGovernor(enabled ? "performance" : "powersave"), `CPU 调频策略已设为 ${enabled ? "Performance" : "Power Save"}`) })) : (SP_JSX.jsx("div", { children: "\u4E0D\u53EF\u7528" })) })] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: cpuState?.error ?? "正在读取 Claw CPU 控制状态…" }) }))] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: state?.error ?? "正在读取 Claw GPU 状态…" }) })), message && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: message }) }))] }));
}
var index = definePlugin(() => ({
    name: "Claw GPU Frequency",
    titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "GPU Frequency" }),
    content: SP_JSX.jsx(GPUFrequencyPanel, {}),
    icon: SP_JSX.jsx(FaMicrochip, {}),
}));

export { index as default };
//# sourceMappingURL=index.js.map
