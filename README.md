# Claw GPU Frequency

A small Decky plugin for controlling the Intel i915 GT0 frequency on the MSI Claw A1M.
The interface uses Decky's built-in panel, slider, button, toggle, and dropdown components.

## Controls

- **Target frequency** requests one GPU frequency by setting the i915 GT0 minimum,
  maximum, and boost frequency limits to the same value.
- **Restore automatic frequency** resets those limits to the hardware's `RPn`–`RP0`
  range and boost frequency to the hardware maximum so the driver can scale the GPU
  dynamically again.
- **Package TDP** sets one shared CPU/GPU package power target through both the
  MSR and MMIO `intel-rapl` sysfs interfaces. Applying it writes the same value to
  PL1 and PL2 on both interfaces. Its range starts at 5 W and ends at the lowest
  hardware maximum reported by the interfaces.
- **CPU Boost** enables or disables Intel Turbo Boost through
  `/sys/devices/system/cpu/intel_pstate/no_turbo`.
- **SMT** enables or disables simultaneous multithreading through the kernel's
  `/sys/devices/system/cpu/smt/control` interface when its current state is
  toggleable. On this Claw A1M topology, SMT applies to the P-core sibling
  threads; E-cores do not have SMT.
- **P/E core counts** controls physical core groups through Linux CPU hotplug.
  P-cores can be set from 1 to 4 because CPU 0 belongs to P-core 1 and must
  remain online; E-cores can be set from 0 to 4. The controls require the
  verified 4P + 4E topology with logical CPUs 0–11.
- **P/E maximum frequency** sets a separate `scaling_max_freq` limit for each
  core class. Limits are saved in Decky's plugin settings directory and applied
  to that class's online CPU frequency policies, including when cores are
  brought online later. A frequency limit is an upper bound; HWP, package power,
  and thermal limits still determine the actual clock.
- **CPU governor** selects a policy from the governors supported by every online
  CPU frequency policy. The selected governor is applied to all those policies.
- **Game profiles** save the current GPU frequency mode, package TDP, CPU Boost,
  SMT, P/E core counts, P/E frequency limits, and governor per Steam app ID.
  Each game has separate **Handheld** and **Docked** slots. The active Steam game
  is detected automatically; choose a slot to save or apply it explicitly.
- The GPU's actual clock, driver and firmware requests, live limits, and available
  hardware throttle reasons are read from sysfs every two seconds.

Loading or refreshing the panel is read-only. The plugin writes GPU and TDP
values only after their apply buttons are selected. CPU toggles apply
immediately; core count sliders apply after **应用核心数量**, and frequency
limits apply after their P-core or E-core button. The TDP slider adjusts the CPU
and GPU's shared package power budget; it is not a direct GPU frequency control.
Applying a game profile explicitly writes its saved controls to the device;
launching a game by itself does not change hardware settings.
All CPU and package power controls refuse to write unless the system identifies
as an MSI Claw A1M. GPU frequency control additionally requires one Intel i915
GT0 frequency interface. Actual GPU clock speed can still be lower than
requested when platform firmware enforces package power or thermal limits. On
supported kernels, the panel reports active i915 throttle reasons such as the
package PL1 power limit. Moving the GPU slider only selects a target;
**Apply GPU Frequency** writes it to the driver.

## Build

```sh
pnpm install
pnpm build
```

The Decky frontend bundle is written to `dist/index.js`; rebuild it after changing
the TypeScript frontend.
