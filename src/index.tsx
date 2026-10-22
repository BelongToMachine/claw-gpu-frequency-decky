import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  SliderField,
  staticClasses,
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

const getGPUState = callable<[], GPUState>("get_gpu_state");
const setGPUFrequency = callable<[frequencyMhz: number], GPUState>("set_gpu_frequency");
const restoreAutomatic = callable<[], GPUState>("restore_gpu_automatic");
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

function GPUFrequencyPanel() {
  const [state, setState] = useState<GPUState | null>(null);
  const [targetMhz, setTargetMhz] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const targetInitialized = useRef(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const next = await getGPUState();
        if (!mounted) return;
        setState(next);
        if (next.supported && !targetInitialized.current) {
          const initial = next.minFreqMhz === next.maxFreqMhz
            ? next.minFreqMhz
            : next.maxFreqMhz;
          setTargetMhz(initial ?? next.hwMaxFreqMhz ?? 0);
          targetInitialized.current = true;
        }
      } catch (error) {
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

  const supported = state?.supported === true;
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
