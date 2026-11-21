## Abli Code 1.0.0

Windows builds of Abli Code, a chat workspace built for abliterated models.

| File | For |
|---|---|
| `Abli-Code-Setup-1.0.0-x64.exe` | 64-bit Intel/AMD, step-by-step setup wizard |
| `Abli-Code-Setup-1.0.0-ia32.exe` | 32-bit (x86), setup wizard |
| `Abli-Code-Setup-1.0.0-arm64.exe` | Windows on ARM, setup wizard |
| `Abli-Code-Setup-1.0.0.exe` | One installer that picks x64 or ARM64 automatically |
| `Abli-Code-1.0.0-win-x64.zip`, `-ia32.zip`, `-arm64.zip` | Portable, unzip and run `Abli Code.exe` |

**New: Abli Mini.** Open it from the sidebar to check what your PC can run, then install Lite, Flash, Coder or Coder 2 (abliterated 1.58-bit ternary models) and chat privately on your own machine.

The installers are not code signed yet, so Windows SmartScreen may warn. Choose More info, then Run anyway.

The 32-bit (x86) build uses Electron 43, because Electron 45 no longer ships 32-bit Windows builds.

## Abli Code CLI

New: a terminal version. Download `abli.mjs` (and `abli.cmd` on Windows) and run `node abli.mjs login`. Needs Node 18 or newer.
