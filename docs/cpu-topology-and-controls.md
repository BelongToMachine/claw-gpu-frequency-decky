# Claw A1M CPU 拓扑与控制接口记录

记录日期：2026-10-23

## 结论摘要

掌机报告的处理器型号是 **Intel Core Ultra 5 135H**。完整 SKU 是 4 个 P-core、8 个 E-core、2 个 LPE-core，共 14 个物理核心、18 个逻辑线程。

用户回忆的 BIOS 设置是：P-core 数量保留 4 个、E-core 从 8 个减到 4 个、两个 LPE-core 关闭。按此配置应得到：

- 4 个 P-core × 2 个 SMT 线程 = 8 个逻辑 CPU
- 4 个 E-core × 1 个线程 = 4 个逻辑 CPU
- 0 个 LPE-core × 1 个线程 = 0 个逻辑 CPU
- 合计 8 个物理核心、12 个逻辑 CPU

这与当前 Linux 报告的 **present=0-11**、共 12 个逻辑 CPU 完全吻合。因此，用户记得的 BIOS 核心数量设置很可能就是系统只识别到 12 个逻辑 CPU 的原因；但我们没有直接读取 BIOS 页面，具体设置仍属于用户回忆与系统数据相互印证的推断。

当前这 12 个逻辑 CPU 中只有 CPU 0–3 在线。CPU 0/1 和 CPU 2/3 分别是两个 SMT 线程组，也就是当前只有两个物理 P-core 的四个逻辑线程在运行。CPU 4–11 被 Linux 标记为离线，仍然出现在系统中；这不是 BIOS 将它们隐藏掉的状态。

## 处理器型号与核心类型

掌机实时报告：

- 机型：MSI Claw A1M
- CPU：Intel Core Ultra 5 135H

Intel 对 135H 的完整配置为 4P + 8E + 2LPE。这里的“大核”和“性能核”都指 P-core；E-core 是能效核；LPE-core 是低功耗能效核。[Intel 官方处理器资料](https://download.intel.com/newsroom/2024/mwc/Platform_Brief_Intel_vPro_with_Intel_Core_Ultra_Processors.pdf)

| 类别 | 135H 完整 SKU | 用户回忆的 BIOS 设置 | 产生的逻辑 CPU |
|---|---:|---:|---:|
| P-core（大核/性能核） | 4 | 保留 4 个 | 8（SMT 开启） |
| E-core（能效核） | 8 | 减为 4 个 | 4 |
| LPE-core（低功耗能效核） | 2 | 全部关闭 | 0 |
| **合计** | **14 个物理核心** | **8 个物理核心** | **12 个逻辑 CPU** |

## Linux 实时拓扑快照

通过 SSH 只读查询得到：

| Linux 信息 | 当前值 | 含义 |
|---|---|---|
| possible | 0-11 | 内核为 12 个逻辑 CPU 预留了资源 |
| present | 0-11 | 系统识别到 12 个逻辑 CPU |
| online | 0-3 | 当前有 4 个逻辑 CPU 在线 |
| offline | 4-11 | 8 个已识别的逻辑 CPU 当前离线 |
| smt/control | on | SMT 控制当前开启 |
| smt/active | 1 | 当前至少有一个 SMT sibling 在线 |

当前在线 CPU 的拓扑：

- CPU 0 和 CPU 1 的 thread_siblings_list 是 0-1，共享 core_id=8。
- CPU 2 和 CPU 3 的 thread_siblings_list 是 2-3，共享 core_id=12。
- CPU 0 没有独立的 cpu0/online 节点；CPU 1–11 有各自的 online 节点。

### 完整的 P/E 核逻辑 CPU 编号映射

为读取离线 CPU 的拓扑，先记录原在线集合 `0-3`，临时将 CPU 0–11 全部上线，读取每个 CPU 的 `core_id` 和 `thread_siblings_list`，随后恢复并核验在线集合为 `0-3`。未更改频率或 BIOS 设置。

| 物理核心 | Linux 逻辑 CPU | 内核报告的 core_id | 依据 |
|---|---:|---:|---|
| P-core 1 | 0、1 | 8 | SMT 兄弟组 `0-1` |
| P-core 2 | 2、3 | 12 | SMT 兄弟组 `2-3` |
| P-core 3 | 4、5 | 16 | SMT 兄弟组 `4-5` |
| P-core 4 | 6、7 | 20 | SMT 兄弟组 `6-7` |
| E-core 1 | 8 | 0 | 单线程核心；结合 BIOS 配置为 4P+4E、LPE 关闭 |
| E-core 2 | 9 | 1 | 单线程核心；结合 BIOS 配置为 4P+4E、LPE 关闭 |
| E-core 3 | 10 | 2 | 单线程核心；结合 BIOS 配置为 4P+4E、LPE 关闭 |
| E-core 4 | 11 | 3 | 单线程核心；结合 BIOS 配置为 4P+4E、LPE 关闭 |

因此编号可按 `CPU 0–7 = 4 个 P-core 的 8 个 SMT 线程`、`CPU 8–11 = 4 个 E-core` 分组。P-core 数量控制应以 SMT 兄弟组为单位，例如上下线 CPU 4 和 5 来控制第三个 P-core；E-core 可逐个控制 CPU 8–11。满载是 8 个物理核心、12 个逻辑 CPU，而不是 12 个物理核心。

本次在线检查没有读到 `topology/core_type` 文件；P-core 由 SMT 兄弟关系直接确认，E-core 分类则依据单线程拓扑和用户提供的 BIOS 核心配置。恢复过程中首次核对发现在线集合暂为 `0`，随即重新上线 CPU 1–3；最终再次确认恢复为原来的 `0-3`。

Linux 的 present、online、offline 是不同状态：CPU 可以已被识别但处于运行时离线状态，之后再通过 CPU hotplug 上线。[Linux CPU 拓扑文档](https://docs.kernel.org/5.16/admin-guide/cputopology.html) [Linux CPU hotplug 文档](https://docs.kernel.org/6.10/core-api/cpu_hotplug.html)

内核启动参数没有 maxcpus= 或 nr_cpus= 限制，内核 kernel_max 为 8191。因此，12 个 CPU 的可见数量更像是平台固件向 Linux 提供的 CPU 配置，而不是内核只允许 12 个 CPU。结合用户回忆，4P + 4E + 0LPE 是最吻合的解释。

### BIOS 禁用与 Linux 离线的区别

- BIOS/固件未提供给操作系统的逻辑 CPU，一般不会出现在当前的 present 列表。
- CPU 4–11 出现在 present 中，但 /sys/devices/system/cpu/cpuN/online 为 0，表示它们目前是 Linux 运行时离线。
- 内核日志中存在 CPU 被 Booting 和 now offline 的热插拔记录，证明至少这些 CPU 曾经由操作系统上线、下线。
- 本次曾将 CPU 4–11 临时上线以读取拓扑，并在检查后恢复到原来的 `online=0-3`。因此现在已能确认 CPU 4–7 是其余两个 P-core 的 SMT 线程，CPU 8–11 是四个 E-core；这些 CPU 当前仍是 Linux 运行时离线状态，并未被 BIOS 隐藏。

## PowerDeck 如何调整在线 CPU 数

本机保留的 PowerDeck v1.0.85 插件代码把配置字段 cpuCores 分发到 cpu_mod.set_online_cores。插件目录目前已经卸载，但 PowerDeck 的配置文件和日志仍保留在掌机上。上游 CPU 后端实现可见于 [PowerDeck 的 cpu.py](https://github.com/fewtarius/PowerDeck/blob/main/powerdeck/hardware/cpu.py#L1113-L1158)。

该接口的做法是：

1. 找出 /sys/devices/system/cpu/cpuN/online 文件并按 CPU 编号排序。
2. 将前 N 个文件写成 1，其余写成 0。
3. 这控制的是 Linux **逻辑 CPU** 的 online 状态；它不按物理核心分组，也不区分 P/E/LPE 类型。
4. CPU 0 没有可写的 online 文件，所以滑块中的 N 并不一定等于系统最终在线逻辑 CPU 总数。若 N=2，接口会尝试让 CPU 1 和 CPU 2 在线，其余可写节点离线；CPU 0 仍会在线。SMT 开关也会影响最终状态。

本机保存的 2409598194_ac.json 配置为 cpuCores=2、smt=false；PowerDeck 日志也记录过游戏配置切换到该 ID。此前一次读取曾看到 online=0,2，与“SMT 关闭、CPU 逻辑热插拔限制”相符。本次状态则是 online=0-3 且 SMT 已开启。配置文件说明 PowerDeck 曾请求过的设置，但卸载插件后设置可能已被别的操作改变，不能单独证明当前离线状态由 PowerDeck 造成。

## 自制插件如何控制 CPU Boost

本地插件代码见 [cpu_control.py](../cpu_control.py) 和 [main.py](../main.py)。

CPU Boost 开关调用 set_cpu_boost()，读写：

/sys/devices/system/cpu/intel_pstate/no_turbo

- 开启 Boost：写入 0，允许 intel_pstate 使用 turbo P-state。
- 关闭 Boost：写入 1，禁止 intel_pstate 使用 turbo P-state。
- 本次读取值为 no_turbo=0，因此 Linux 当前允许 Turbo Boost。

Linux 文档说明，no_turbo=1 会禁止驱动使用 turbo P-state；设为 0 只代表允许驱动和处理器使用 Turbo，并不保证在所有负载下达到某个固定频率。[Linux intel_pstate 文档](https://docs.kernel.org/admin-guide/pm/intel_pstate.html)

因此，自制插件的 CPU Boost **不是固定频率设置**，也不直接写入 BIOS 的 P/E-core 倍频上限。它不能保证 CPU 达到 3500 MHz，也不能绕过固件频率限制、功耗限制或温度限制。

本插件另外有两个独立控制：

- SMT：写入 /sys/devices/system/cpu/smt/control 的 on 或 off，控制 SMT sibling 线程。
- 调频策略：对在线 CPU 对应的 scaling_governor 写入所选策略。

### 本地代码第一版的 P/E 核组控制

本地代码新增了按物理核心分组的数量与频率上限控制；这一版目前只写入本地仓库，尚未安装到掌机。

- P 核数量范围为 1–4。每个 P 核按 SMT sibling 对操作，例如 P 核 3 对应 CPU 4、5。CPU 0 属于 P 核 1，必须保持在线。
- E 核数量范围为 0–4，分别控制 CPU 8–11。
- P 核 SMT 使用 Linux 全局 SMT 控制；切换时保留当前启用的物理核心数，并相应上线或下线这些 P 核的 sibling 线程。
- P 核和 E 核各有一个最高频率上限，写入该类在线 CPUFreq 策略的 scaling_max_freq。离线类别的目标会保存在 Decky 插件设置目录，并在通过插件重新上线时应用。
- UI 每两秒读取一次该类在线策略的上限，以及 cpuinfo_cur_freq 或 scaling_cur_freq 的当前读数。
- 频率值是上限，不是固定频率；HWP、整机功耗和温度约束仍会影响实际频率。
- 核心数量控制会核对 present CPU 列表及当前可读取的 sibling 拓扑；仅支持已核实的 CPU 0–11、4P + 4E 配置，不匹配时拒绝写入。

## 用户回忆的频率上限与当前读数

用户回忆的 BIOS 设定：

- P-core 最高频率限制：3500 MHz
- E-core 最高频率限制：1700 MHz

这些数值没有从 BIOS 页面直接读出。当前 Linux 的 intel_pstate 状态为 no_turbo=0，cpuinfo_max_freq=4600000；各在线逻辑 CPU 的 scaling_max_freq 读数是：

| CPU | 拓扑组 | scaling_max_freq |
|---|---|---:|
| 0 | CPU 0–1 | 4600 MHz |
| 1 | CPU 0–1 | 1700 MHz |
| 2 | CPU 2–3 | 4600 MHz |
| 3 | CPU 2–3 | 1700 MHz |

CPU 0/1 与 CPU 2/3 分别是同物理核心的 SMT siblings，因此不能把 CPU 1、3 的 1700 MHz 读数直接当成“E-core 上限”。这些是 Linux 对各 CPUFreq policy 报告的限制值，不足以验证 BIOS 的 P-core 3500 MHz / E-core 1700 MHz 设置，也不等于当前实际运行频率。要确认 BIOS 上限是否生效，需要在对应核心类型上读取实际频率/硬件性能限制，并在负载下复测。

## 最终判断

1. 用户回忆的 BIOS 核心数量（4P、4E、0LPE）与 Linux 识别到的 12 个逻辑 CPU 精确吻合，是当前最可信的解释。
2. 完整编号映射已确认：CPU 0–7 是 4 个 P-core 的 SMT 线程，CPU 8–11 是 4 个 E-core。当前只有 CPU 0–3 在线，即当前在用两个 P-core；CPU 4–11 已识别但处于 Linux 离线状态。
3. PowerDeck 的在线 CPU 数控制使用 Linux CPU hotplug，按逻辑 CPU 编号逐个写 cpuN/online。保存的游戏配置曾要求 cpuCores=2、smt=false，这能解释为什么在线 CPU 数会比 BIOS 提供的 12 个更少，但无法证明是唯一原因。
4. 自制插件的 Boost 开关通过 intel_pstate/no_turbo 允许或禁止 Turbo；它不会设置固定 MHz，也不会替代 BIOS 对 P-core/E-core 的频率限制。
5. P-core 3500 MHz、E-core 1700 MHz 是用户回忆的 BIOS 限制，当前 Linux 快照没有直接验证这两个硬件上限。
6. 本地代码第一版已加入 P 核 1–4、E 核 0–4、P 核 SMT 和 P/E 分组频率上限控制；设备端仍运行已安装版本，尚未应用这次本地改动。

## 参考资料

- [Intel Core Ultra 5 135H 核心配置](https://download.intel.com/newsroom/2024/mwc/Platform_Brief_Intel_vPro_with_Intel_Core_Ultra_Processors.pdf)
- [PowerDeck CPU online 核心实现](https://github.com/fewtarius/PowerDeck/blob/main/powerdeck/hardware/cpu.py#L1113-L1158)
- [Linux CPU 拓扑状态说明](https://docs.kernel.org/5.16/admin-guide/cputopology.html)
- [Linux CPU hotplug 说明](https://docs.kernel.org/6.10/core-api/cpu_hotplug.html)
- [Linux intel_pstate / no_turbo 说明](https://docs.kernel.org/admin-guide/pm/intel_pstate.html)
- 本仓库实现：[cpu_control.py](../cpu_control.py)、[main.py](../main.py)

