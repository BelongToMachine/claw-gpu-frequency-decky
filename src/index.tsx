import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  SliderField,
  staticClasses,
  ToggleField,
} from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { useEffect, useRef, useState } from "react";
import { FaMicrochip } from "react-icons/fa";

type GPUState = {
  supported: boolean;
  error?: string;
  device?: string;
  driver?: string;
  card?: string;
  gt?: string;
  actualFreqMhz?: number | null;
  requestedFreqMhz?: number | null;
  firmwareRequestedFreqMhz?: number | null;
  throttled?: boolean;
  throttleReasons?: string[];
  minFreqMhz?: number;
  maxFreqMhz?: number;
  boostFreqMhz?: number;
  hwMinFreqMhz?: number;
  hwMaxFreqMhz?: number;
  stepMhz?: number;
};

type PackagePowerState = {
  supported: boolean;
  error?: string;
  interface?: string;
  currentTdpW?: number;
  minTdpW?: number;
  maxTdpW?: number;
};

type CPUControlState = {
  supported: boolean;
  error?: string;
  cpuBoostSupported?: boolean;
  cpuBoostEnabled?: boolean | null;
  cpuBoostError?: string | null;
  smtSupported?: boolean;
  smtEnabled?: boolean | null;
  smtMode?: string | null;
  smtError?: string | null;
  onlineCPUs?: string;
  governorSupported?: boolean;
  currentGovernor?: string | null;
  availableGovernors?: string[];
  governorMixed?: boolean;
  governorError?: string;
  coreControlSupported?: boolean;
  coreControlError?: string | null;
  pCoreCount?: number | null;
  pCoreCountMin?: number;
  pCoreCountMax?: number;
  eCoreCount?: number | null;
  eCoreCountMin?: number;
  eCoreCountMax?: number;
  pCoreFrequencySupported?: boolean;
  pCoreFrequencyError?: string | null;
  pCoreFrequencyMinMhz?: number;
  pCoreFrequencyMaxMhz?: number;
  pCoreFrequencyCurrentMhz?: number | null;
  pCoreFrequencyTargetMhz?: number | null;
  pCoreFrequencyMixed?: boolean;
  pCoreFrequencyOnlinePolicies?: number;
  pCoreActualFrequencyMinMhz?: number | null;
  pCoreActualFrequencyMaxMhz?: number | null;
  pCoreActualFrequencyReadings?: number;
  eCoreFrequencySupported?: boolean;
  eCoreFrequencyError?: string | null;
  eCoreFrequencyMinMhz?: number;
  eCoreFrequencyMaxMhz?: number;
  eCoreFrequencyCurrentMhz?: number | null;
  eCoreFrequencyTargetMhz?: number | null;
  eCoreFrequencyMixed?: boolean;
  eCoreFrequencyOnlinePolicies?: number;
  eCoreActualFrequencyMinMhz?: number | null;
  eCoreActualFrequencyMaxMhz?: number | null;
  eCoreActualFrequencyReadings?: number;
};

const getGPUState = callable<[], GPUState>("get_gpu_state");
const setGPUFrequency = callable<[frequencyMhz: number], GPUState>("set_gpu_frequency");
const restoreAutomatic = callable<[], GPUState>("restore_gpu_automatic");
const getPackagePowerState = callable<[], PackagePowerState>("get_package_power_state");
const setPackageTDP = callable<[powerWatts: number], PackagePowerState>("set_package_tdp");
const getCPUControlState = callable<[], CPUControlState>("get_cpu_control_state");
const setCPUBoost = callable<[enabled: boolean], CPUControlState>("set_cpu_boost");
const setSMT = callable<[enabled: boolean], CPUControlState>("set_smt");
const setCPUGovernor = callable<[governor: string], CPUControlState>("set_cpu_governor");
const setCPUCoreCounts = callable<[pCoreCount: number, eCoreCount: number], CPUControlState>("set_cpu_core_counts");
const setCPUClusterFrequencyLimit = callable<[coreType: "p" | "e", frequencyMhz: number], CPUControlState>("set_cpu_cluster_frequency_limit");
const THROTTLE_LABELS: Record<string, string> = {
  pl1: "整机封装功耗限制（PL1）",
  pl2: "短时封装功耗限制（PL2）",
  pl4: "瞬时功耗限制（PL4）",
  thermal: "温度限制",
  prochot: "PROCHOT 温度/功耗限制",
  ratl: "温度/功耗算法限制（RATL）",
  vr_thermalert: "电压调节器温度限制",
  vr_tdc: "电流限制",
};

function formatFrequencyRange(minMhz?: number | null, maxMhz?: number | null) {
  if (minMhz == null || maxMhz == null) return "暂无读数";
  return minMhz === maxMhz ? `${minMhz} MHz` : `${minMhz}–${maxMhz} MHz`;
}

function GPUFrequencyPanel() {
  const [state, setState] = useState<GPUState | null>(null);
  const [powerState, setPowerState] = useState<PackagePowerState | null>(null);
  const [cpuState, setCPUState] = useState<CPUControlState | null>(null);
  const [targetMhz, setTargetMhz] = useState<number | null>(null);
  const [targetTdpW, setTargetTdpW] = useState<number | null>(null);
  const [targetPCoreCount, setTargetPCoreCount] = useState<number | null>(null);
  const [targetECoreCount, setTargetECoreCount] = useState<number | null>(null);
  const [targetPCoreFrequencyMhz, setTargetPCoreFrequencyMhz] = useState<number | null>(null);
  const [targetECoreFrequencyMhz, setTargetECoreFrequencyMhz] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const targetInitialized = useRef(false);
  const powerTargetInitialized = useRef(false);
  const coreTargetsInitialized = useRef(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const [gpuResult, powerResult, cpuResult] = await Promise.allSettled([
        getGPUState(),
        getPackagePowerState(),
        getCPUControlState(),
      ]);
      if (!mounted) return;

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
      } else {
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
      } else {
        const error = powerResult.reason;
        setPowerState({ supported: false, error: error instanceof Error ? error.message : String(error) });
      }

      if (cpuResult.status === "fulfilled") {
        const next = cpuResult.value;
        setCPUState(next);
        if (next.coreControlSupported && !coreTargetsInitialized.current) {
          setTargetPCoreCount(next.pCoreCount ?? 1);
          setTargetECoreCount(next.eCoreCount ?? 0);
          setTargetPCoreFrequencyMhz(
            next.pCoreFrequencyTargetMhz
              ?? next.pCoreFrequencyMaxMhz
              ?? 4600,
          );
          setTargetECoreFrequencyMhz(
            next.eCoreFrequencyTargetMhz
              ?? next.eCoreFrequencyMaxMhz
              ?? 3600,
          );
          coreTargetsInitialized.current = true;
        }
      } else {
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

  const apply = async (action: () => Promise<GPUState>, successMessage: string) => {
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const applyPackageTDP = async () => {
    if (targetTdpW == null) return;
    setBusy(true);
    setMessage("");
    try {
      const next = await setPackageTDP(targetTdpW);
      setPowerState(next);
      setTargetTdpW(next.currentTdpW ?? targetTdpW);
      setMessage(`MSR + MMIO 的 PL1/PL2 已同步为 ${next.currentTdpW ?? targetTdpW} W`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const applyCPUControl = async (
    action: () => Promise<CPUControlState>,
    successMessage: string,
  ) => {
    setBusy(true);
    setMessage("");
    try {
      const next = await action();
      setCPUState(next);
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const applyCPUCoreCounts = async () => {
    if (targetPCoreCount == null || targetECoreCount == null) return;
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const applyCPUFrequencyLimit = async (coreType: "p" | "e") => {
    const frequencyMhz = coreType === "p" ? targetPCoreFrequencyMhz : targetECoreFrequencyMhz;
    if (frequencyMhz == null) return;
    setBusy(true);
    setMessage("");
    try {
      const next = await setCPUClusterFrequencyLimit(coreType, frequencyMhz);
      setCPUState(next);
      const activePolicies = coreType === "p"
        ? next.pCoreFrequencyOnlinePolicies ?? 0
        : next.eCoreFrequencyOnlinePolicies ?? 0;
      setMessage(
        activePolicies > 0
          ? `已设定 ${coreType.toUpperCase()} 核最高频率 ${frequencyMhz} MHz（${activePolicies} 个在线策略）`
          : `${coreType.toUpperCase()} 核最高频率 ${frequencyMhz} MHz 已保存，核心上线时应用`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const supported = state?.supported === true;
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

  return (
    <PanelSection title="GPU Frequency">
      <PanelSectionRow>
        <div className={staticClasses.PanelSectionTitle}>GPU 实际频率：{actualText}</div>
      </PanelSectionRow>

      {supported ? (
        <>
          <PanelSectionRow>
            <div>
              频率限制：{state.minFreqMhz}–{state.maxFreqMhz} MHz · Boost：{state.boostFreqMhz} MHz
            </div>
          </PanelSectionRow>
          {(state.requestedFreqMhz != null || state.firmwareRequestedFreqMhz != null) && (
            <PanelSectionRow>
              <div>
                驱动请求：{state.requestedFreqMhz ?? "—"} MHz · 固件请求：{state.firmwareRequestedFreqMhz ?? "—"} MHz
              </div>
            </PanelSectionRow>
          )}
          {state.throttled && (
            <PanelSectionRow>
              <div>
                固件限频：{state.throttleReasons?.length
                  ? state.throttleReasons.map((reason) => THROTTLE_LABELS[reason] ?? reason).join("、")
                  : "生效（原因暂不可读）"}
              </div>
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <SliderField
              label="目标频率"
              description={`硬件范围 ${state.hwMinFreqMhz}–${state.hwMaxFreqMhz} MHz；调整后点“应用 GPU 频率”才写入驱动`}
              min={state.hwMinFreqMhz ?? 0}
              max={state.hwMaxFreqMhz ?? 0}
              step={state.stepMhz ?? 50}
              value={targetMhz ?? state.maxFreqMhz ?? 0}
              showValue
              valueSuffix=" MHz"
              disabled={busy}
              onChange={(value) => setTargetMhz(value)}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              disabled={busy || targetMhz == null}
              onClick={() => targetMhz != null && void apply(
                () => setGPUFrequency(targetMhz),
                `已请求固定到 ${targetMhz} MHz`,
              )}
            >
              应用 GPU 频率
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              disabled={busy}
              onClick={() => void apply(restoreAutomatic, "已恢复自动频率范围")}
            >
              恢复自动频率
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div>插件只请求 GPU 频率；整机功耗或温度限频由固件控制，实际频率可能低于请求值。</div>
          </PanelSectionRow>

          <PanelSectionRow>
            <div className={staticClasses.PanelSectionTitle}>整机 TDP（MSR + MMIO）</div>
          </PanelSectionRow>
          {powerState?.supported ? (
            <>
              <PanelSectionRow>
                <div>当前有效整机上限：{powerState.currentTdpW} W · 硬件上限：{powerState.maxTdpW} W</div>
              </PanelSectionRow>
              <PanelSectionRow>
                <SliderField
                  label="整机 TDP"
                  description={`范围 ${powerState.minTdpW}–${powerState.maxTdpW} W；应用后同步设置 MSR 与 MMIO 的 PL1、PL2`}
                  min={powerState.minTdpW ?? 5}
                  max={powerState.maxTdpW ?? 28}
                  step={1}
                  value={targetTdpW ?? powerState.currentTdpW ?? powerState.minTdpW ?? 5}
                  showValue
                  valueSuffix=" W"
                  disabled={busy}
                  onChange={(value) => setTargetTdpW(value)}
                />
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem
                  layout="below"
                  disabled={busy || targetTdpW == null}
                  onClick={() => void applyPackageTDP()}
                >
                  应用 TDP
                </ButtonItem>
              </PanelSectionRow>
              <PanelSectionRow>
                <div>此项为 CPU 与 GPU 设置共享的整机功耗目标；应用时同步写入 MSR 和 MMIO，不修改 GPU 频率。</div>
              </PanelSectionRow>
            </>
          ) : (
            <PanelSectionRow>
              <div>{powerState?.error ?? "正在读取 MSR / MMIO RAPL 功耗状态…"}</div>
            </PanelSectionRow>
          )}

          <PanelSectionRow>
            <div className={staticClasses.PanelSectionTitle}>CPU Controls</div>
          </PanelSectionRow>
          {cpuState?.supported ? (
            <>
              {cpuState.coreControlSupported ? (
                <>
                  <PanelSectionRow>
                    <div className={staticClasses.PanelSectionTitle}>P/E 核心数量</div>
                  </PanelSectionRow>
                  <PanelSectionRow>
                    <div>
                      当前在线：P 核 {cpuState.pCoreCount}/4 · E 核 {cpuState.eCoreCount}/4 · 逻辑 CPU {cpuState.onlineCPUs ?? "—"}
                    </div>
                  </PanelSectionRow>
                  <PanelSectionRow>
                    <SliderField
                      label="P 核数量"
                      description="按物理核心计数；CPU 0 所在的 P 核必须保留"
                      min={cpuState.pCoreCountMin ?? 1}
                      max={cpuState.pCoreCountMax ?? 4}
                      step={1}
                      value={targetPCoreCount ?? cpuState.pCoreCount ?? 1}
                      showValue
                      disabled={busy}
                      onChange={(value) => setTargetPCoreCount(value)}
                    />
                  </PanelSectionRow>
                  <PanelSectionRow>
                    <SliderField
                      label="E 核数量"
                      description="按物理核心计数，可设为 0–4"
                      min={cpuState.eCoreCountMin ?? 0}
                      max={cpuState.eCoreCountMax ?? 4}
                      step={1}
                      value={targetECoreCount ?? cpuState.eCoreCount ?? 0}
                      showValue
                      disabled={busy}
                      onChange={(value) => setTargetECoreCount(value)}
                    />
                  </PanelSectionRow>
                  <PanelSectionRow>
                    <ButtonItem
                      layout="below"
                      disabled={busy || targetPCoreCount == null || targetECoreCount == null}
                      onClick={() => void applyCPUCoreCounts()}
                    >
                      应用核心数量
                    </ButtonItem>
                  </PanelSectionRow>

                  <PanelSectionRow>
                    <div className={staticClasses.PanelSectionTitle}>P/E 核最高频率</div>
                  </PanelSectionRow>
                  {cpuState.pCoreFrequencySupported ? (
                    <>
                      <PanelSectionRow>
                        <SliderField
                          label="P 核最高频率"
                          description={`范围 ${cpuState.pCoreFrequencyMinMhz}–${cpuState.pCoreFrequencyMaxMhz} MHz；应用后统一在线 P 核策略${cpuState.pCoreFrequencyMixed ? "（当前策略不一致）" : ""}`}
                          min={cpuState.pCoreFrequencyMinMhz ?? 400}
                          max={cpuState.pCoreFrequencyMaxMhz ?? 4600}
                          step={100}
                          value={targetPCoreFrequencyMhz ?? cpuState.pCoreFrequencyMaxMhz ?? 4600}
                          showValue
                          valueSuffix=" MHz"
                          disabled={busy}
                          onChange={(value) => setTargetPCoreFrequencyMhz(value)}
                        />
                      </PanelSectionRow>
                      <PanelSectionRow>
                        <div>
                          当前 P 核上限：{cpuState.pCoreFrequencyCurrentMhz != null
                            ? `${cpuState.pCoreFrequencyCurrentMhz} MHz`
                            : cpuState.pCoreFrequencyMixed
                              ? "策略不一致"
                              : cpuState.pCoreFrequencyOnlinePolicies === 0
                                ? "无在线策略"
                                : "未读取"}
                        </div>
                      </PanelSectionRow>
                      <PanelSectionRow>
                        <div>
                          P 核当前 CPUFreq 读数：{formatFrequencyRange(
                            cpuState.pCoreActualFrequencyMinMhz,
                            cpuState.pCoreActualFrequencyMaxMhz,
                          )}
                        </div>
                      </PanelSectionRow>
                      <PanelSectionRow>
                        <ButtonItem
                          layout="below"
                          disabled={busy || targetPCoreFrequencyMhz == null}
                          onClick={() => void applyCPUFrequencyLimit("p")}
                        >
                          应用 P 核频率
                        </ButtonItem>
                      </PanelSectionRow>
                    </>
                  ) : (
                    <PanelSectionRow>
                      <div>{cpuState.pCoreFrequencyError ?? "P 核频率策略不可用"}</div>
                    </PanelSectionRow>
                  )}
                  {cpuState.eCoreFrequencySupported ? (
                    <>
                      <PanelSectionRow>
                        <SliderField
                          label="E 核最高频率"
                          description={`范围 ${cpuState.eCoreFrequencyMinMhz}–${cpuState.eCoreFrequencyMaxMhz} MHz；上限会保存，并在 E 核上线时应用`}
                          min={cpuState.eCoreFrequencyMinMhz ?? 400}
                          max={cpuState.eCoreFrequencyMaxMhz ?? 3600}
                          step={100}
                          value={targetECoreFrequencyMhz ?? cpuState.eCoreFrequencyMaxMhz ?? 3600}
                          showValue
                          valueSuffix=" MHz"
                          disabled={busy}
                          onChange={(value) => setTargetECoreFrequencyMhz(value)}
                        />
                      </PanelSectionRow>
                      <PanelSectionRow>
                        <div>
                          当前 E 核上限：{cpuState.eCoreFrequencyCurrentMhz != null
                            ? `${cpuState.eCoreFrequencyCurrentMhz} MHz`
                            : cpuState.eCoreFrequencyMixed
                              ? "策略不一致"
                              : cpuState.eCoreFrequencyOnlinePolicies === 0
                                ? "无在线策略"
                                : "未读取"}
                        </div>
                      </PanelSectionRow>
                      <PanelSectionRow>
                        <div>
                          E 核当前 CPUFreq 读数：{formatFrequencyRange(
                            cpuState.eCoreActualFrequencyMinMhz,
                            cpuState.eCoreActualFrequencyMaxMhz,
                          )}
                        </div>
                      </PanelSectionRow>
                      <PanelSectionRow>
                        <ButtonItem
                          layout="below"
                          disabled={busy || targetECoreFrequencyMhz == null}
                          onClick={() => void applyCPUFrequencyLimit("e")}
                        >
                          应用 E 核频率
                        </ButtonItem>
                      </PanelSectionRow>
                    </>
                  ) : (
                    <PanelSectionRow>
                      <div>{cpuState.eCoreFrequencyError ?? "E 核频率策略不可用"}</div>
                    </PanelSectionRow>
                  )}
                </>
              ) : (
                <PanelSectionRow>
                  <div>{cpuState.coreControlError ?? "当前 CPU 拓扑不符合受支持的 Claw A1M 4P + 4E 映射"}</div>
                </PanelSectionRow>
              )}
              <PanelSectionRow>
                <ToggleField
                  label="CPU Boost（Turbo）"
                  description={cpuState.cpuBoostSupported
                    ? (cpuState.cpuBoostEnabled ? "开启" : "关闭")
                    : "不可用"}
                  checked={cpuState.cpuBoostEnabled ?? false}
                  disabled={busy || !cpuState.cpuBoostSupported || cpuState.cpuBoostEnabled == null}
                  onChange={(enabled) => void applyCPUControl(
                    () => setCPUBoost(enabled),
                    enabled ? "已启用 CPU Boost" : "已关闭 CPU Boost",
                  )}
                />
              </PanelSectionRow>
              <PanelSectionRow>
                <ToggleField
                  label="P 核 SMT（超线程）"
                  description={!cpuState.coreControlSupported
                    ? "当前 CPU 拓扑不支持分组控制"
                    : cpuState.smtSupported
                    ? (cpuState.smtEnabled ? "开启 · 在线 P 核启用双线程" : "关闭 · 在线 P 核各保留一个线程")
                    : "不可切换"}
                  checked={cpuState.smtEnabled ?? false}
                  disabled={busy || !cpuState.coreControlSupported || !cpuState.smtSupported || cpuState.smtEnabled == null}
                  onChange={(enabled) => void applyCPUControl(
                    () => setSMT(enabled),
                    enabled ? "已启用 SMT（超线程）" : "已关闭 SMT（超线程）",
                  )}
                />
              </PanelSectionRow>
              <PanelSectionRow>
                {cpuState.governorSupported ? (
                  <ToggleField
                    label="CPU 调频策略"
                    description={cpuState.governorError ?? governorToggleDescription}
                    checked={cpuState.currentGovernor === "performance"}
                    disabled={busy || !governorToggleSupported}
                    onChange={(enabled) => void applyCPUControl(
                      () => setCPUGovernor(enabled ? "performance" : "powersave"),
                      `CPU 调频策略已设为 ${enabled ? "Performance" : "Power Save"}`,
                    )}
                  />
                ) : (
                  <div>不可用</div>
                )}
              </PanelSectionRow>
            </>
          ) : (
            <PanelSectionRow>
              <div>{cpuState?.error ?? "正在读取 Claw CPU 控制状态…"}</div>
            </PanelSectionRow>
          )}
        </>
      ) : (
        <PanelSectionRow>
          <div>{state?.error ?? "正在读取 Claw GPU 状态…"}</div>
        </PanelSectionRow>
      )}

      {message && (
        <PanelSectionRow>
          <div>{message}</div>
        </PanelSectionRow>
      )}
    </PanelSection>
  );
}

export default definePlugin(() => ({
  name: "Claw GPU Frequency",
  titleView: <div className={staticClasses.Title}>GPU Frequency</div>,
  content: <GPUFrequencyPanel />,
  icon: <FaMicrochip />,
}));
