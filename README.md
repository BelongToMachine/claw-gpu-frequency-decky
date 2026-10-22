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
  toggleable.
- **CPU governor** selects a policy from the governors supported by every online
  CPU frequency policy. The selected governor is applied to all those policies.
- The GPU's actual clock, driver and firmware requests, live limits, and available
  hardware throttle reasons are read from sysfs every two seconds.

The plugin only writes after the user selects **Apply GPU Frequency**,
**Restore automatic frequency**, **Apply TDP**, or changes one of the CPU controls.
Loading or refreshing the panel is read-only. The TDP slider adjusts the CPU and
GPU's shared package power budget; it is not a direct GPU frequency control.
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
