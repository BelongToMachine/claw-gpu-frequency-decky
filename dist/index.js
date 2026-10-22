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

const getGPUState = callable("get_gpu_state");
const setGPUFrequency = callable("set_gpu_frequency");
const restoreAutomatic = callable("restore_gpu_automatic");
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
function GPUFrequencyPanel() {
    const [state, setState] = SP_REACT.useState(null);
    const [targetMhz, setTargetMhz] = SP_REACT.useState(null);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [message, setMessage] = SP_REACT.useState("");
    const targetInitialized = SP_REACT.useRef(false);
    SP_REACT.useEffect(() => {
        let mounted = true;
        const refresh = async () => {
            try {
                const next = await getGPUState();
                if (!mounted)
                    return;
                setState(next);
                if (next.supported && !targetInitialized.current) {
                    const initial = next.minFreqMhz === next.maxFreqMhz
                        ? next.minFreqMhz
                        : next.maxFreqMhz;
                    setTargetMhz(initial ?? next.hwMaxFreqMhz ?? 0);
                    targetInitialized.current = true;
                }
            }
            catch (error) {
                if (mounted) {
                    setState({ supported: false, error: error instanceof Error ? error.message : String(error) });
                }
            }
        };
        void refresh();
        const timer = window.setInterval(() => void refresh(), 2000);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);
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
    const supported = state?.supported === true;
    const actualText = !supported
        ? "—"
        : state.actualFreqMhz == null
            ? "空闲 / 暂无读数"
            : `${state.actualFreqMhz} MHz`;
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "GPU Frequency", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { className: DFL.staticClasses.PanelSectionTitle, children: ["GPU \u5B9E\u9645\u9891\u7387\uFF1A", actualText] }) }), supported ? (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u9891\u7387\u9650\u5236\uFF1A", state.minFreqMhz, "\u2013", state.maxFreqMhz, " MHz \u00B7 Boost\uFF1A", state.boostFreqMhz, " MHz"] }) }), (state.requestedFreqMhz != null || state.firmwareRequestedFreqMhz != null) && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u9A71\u52A8\u8BF7\u6C42\uFF1A", state.requestedFreqMhz ?? "—", " MHz \u00B7 \u56FA\u4EF6\u8BF7\u6C42\uFF1A", state.firmwareRequestedFreqMhz ?? "—", " MHz"] }) })), state.throttled && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { children: ["\u56FA\u4EF6\u9650\u9891\uFF1A", state.throttleReasons?.length
                                    ? state.throttleReasons.map((reason) => THROTTLE_LABELS[reason] ?? reason).join("、")
                                    : "生效（原因暂不可读）"] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.SliderField, { label: "\u76EE\u6807\u9891\u7387", description: `硬件范围 ${state.hwMinFreqMhz}–${state.hwMaxFreqMhz} MHz；调整后点“应用 GPU 频率”才写入驱动`, min: state.hwMinFreqMhz ?? 0, max: state.hwMaxFreqMhz ?? 0, step: state.stepMhz ?? 50, value: targetMhz ?? state.maxFreqMhz ?? 0, showValue: true, valueSuffix: " MHz", disabled: busy, onChange: (value) => setTargetMhz(value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy || targetMhz == null, onClick: () => targetMhz != null && void apply(() => setGPUFrequency(targetMhz), `已请求固定到 ${targetMhz} MHz`), children: "\u5E94\u7528 GPU \u9891\u7387" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: busy, onClick: () => void apply(restoreAutomatic, "已恢复自动频率范围"), children: "\u6062\u590D\u81EA\u52A8\u9891\u7387" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: "\u63D2\u4EF6\u53EA\u8BF7\u6C42 GPU \u9891\u7387\uFF1B\u6574\u673A\u529F\u8017\u6216\u6E29\u5EA6\u9650\u9891\u7531\u56FA\u4EF6\u63A7\u5236\uFF0C\u5B9E\u9645\u9891\u7387\u53EF\u80FD\u4F4E\u4E8E\u8BF7\u6C42\u503C\u3002" }) })] })) : (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: state?.error ?? "正在读取 Claw GPU 状态…" }) })), message && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { children: message }) }))] }));
}
var index = definePlugin(() => ({
    name: "Claw GPU Frequency",
    titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "GPU Frequency" }),
    content: SP_JSX.jsx(GPUFrequencyPanel, {}),
    icon: SP_JSX.jsx(FaMicrochip, {}),
}));

export { index as default };
//# sourceMappingURL=index.js.map
