# Claw GPU Frequency

A small Decky plugin for controlling the Intel i915 GT0 frequency on the MSI Claw A1M.
The interface uses Decky's built-in panel, slider, and button components.

## Controls

- **Target frequency** requests one GPU frequency by setting the i915 GT0 minimum,
  maximum, and boost frequency limits to the same value.
- **Restore automatic frequency** resets those limits to the hardware's `RPn`–`RP0`
  range and boost frequency to the hardware maximum so the driver can scale the GPU
  dynamically again.
- The current frequency and live limits are read from sysfs every two seconds.

The plugin only writes after the user selects **Apply GPU Frequency** or
**Restore automatic frequency**. Loading or refreshing the panel is read-only.
The backend refuses to write unless the system identifies as an MSI Claw A1M
and exposes one Intel i915 GT0 frequency interface. Actual clock speed can still
be lower than requested when power or thermal limits apply.

## Build

```sh
pnpm install
pnpm build
```

The Decky frontend bundle is written to `dist/index.js`; rebuild it after changing
the TypeScript frontend.
