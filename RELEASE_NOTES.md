## Abli Code 1.0.0

Desktop builds of Abli Code, a chat workspace built for abliterated models.

### Windows
| File | For |
|---|---|
| `Abli-Code-Setup-1.0.0-x64.exe` | 64-bit Intel/AMD, step-by-step setup wizard |
| `Abli-Code-Setup-1.0.0-ia32.exe` | 32-bit (x86), setup wizard |
| `Abli-Code-Setup-1.0.0-arm64.exe` | Windows on ARM, setup wizard |
| `Abli-Code-Setup-1.0.0.exe` | One installer that picks x64 or ARM64 automatically |
| `Abli-Code-1.0.0-win-x64.zip`, `-ia32.zip`, `-arm64.zip` | Portable, unzip and run `Abli Code.exe` |

The installers are not code signed yet, so Windows SmartScreen may warn. Choose More info, then Run anyway.

### macOS
| File | For |
|---|---|
| `Abli-Code-1.0.0-mac-arm64.zip` | Apple Silicon (M1 and newer) |
| `Abli-Code-1.0.0-mac-x64.zip` | Intel Macs |

The Mac builds are unsigned and have not been tested on real Mac hardware. After unzipping, run in Terminal:

```
xattr -cr "Abli Code.app"
codesign --force --deep --sign - "Abli Code.app"   # Apple Silicon only
```

There is no .dmg yet: a dmg can only be built on macOS.

### Notes
- The 32-bit (x86) build uses Electron 43, because Electron 45 no longer ships 32-bit Windows builds.
- Sign in opens your default browser. Provider keys never ship in the app.