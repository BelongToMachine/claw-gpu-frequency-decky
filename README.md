# Claw GPU Frequency

A small Decky plugin for controlling the Intel i915 GT0 frequency on the MSI Claw A1M.
The interface uses Decky's built-in panel, slider, and button components.

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
- The GPU's actual clock, driver and firmware requests, live limits, and available
  hardware throttle reasons are read from sysfs every two seconds.

The plugin only writes after the user selects **Apply GPU Frequency**,
**Restore automatic frequency**, or **Apply TDP**. Loading or refreshing the panel
is read-only. The TDP slider adjusts the CPU and GPU's shared package power budget;
it is not a direct GPU frequency control.
The backend refuses to write unless the system identifies as an MSI Claw A1M
and exposes one Intel i915 GT0 frequency interface. Actual clock speed can still
be lower than requested when the platform firmware enforces package power or
thermal limits. On supported kernels, the panel reports active i915 throttle
reasons such as the package PL1 power limit. Moving the slider only selects a
target; **Apply GPU Frequency** writes it to the driver.

## Build

```sh
pnpm install
pnpm build
```

The Decky frontend bundle is written to `dist/index.js`; rebuild it after changing
the TypeScript frontend.
