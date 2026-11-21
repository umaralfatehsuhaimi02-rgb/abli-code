<p align="center">
  <img src="docs/banner.svg" alt="Abli Code" width="100%">
</p>

<p align="center">
  <a href="https://github.com/umaralfatehsuhaimi02-rgb/abli-code/releases/latest"><img alt="Download" src="https://img.shields.io/badge/Download-v1.0.0-ff2547?style=for-the-badge&labelColor=060608"></a>
  <img alt="Platforms" src="https://img.shields.io/badge/Windows%20%7C%20macOS-x64%20%7C%20x86%20%7C%20arm64-fafafa?style=for-the-badge&labelColor=060608">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-ff2547?style=for-the-badge&labelColor=060608">
</p>

<p align="center">
  <img src="public/icon.png" alt="Abli Code logo" width="96">
</p>

<h3 align="center">A chat workspace built for abliterated models.<br>Desktop and web, one account, one app.</h3>

---

## Download

Grab the latest build from the [Releases page](https://github.com/umaralfatehsuhaimi02-rgb/abli-code/releases/latest).

| Platform | Installer (wizard) | Portable zip |
|---|---|---|
| Windows 64-bit (x64) | `Abli-Code-Setup-1.0.0-x64.exe` | `Abli-Code-1.0.0-win-x64.zip` |
| Windows 32-bit (x86) | `Abli-Code-Setup-1.0.0-ia32.exe` | `Abli-Code-1.0.0-win-ia32.zip` |
| Windows on ARM (arm64) | `Abli-Code-Setup-1.0.0-arm64.exe` | `Abli-Code-1.0.0-win-arm64.zip` |
| macOS Apple Silicon | n/a | `Abli-Code-1.0.0-mac-arm64.zip` |
| macOS Intel | n/a | `Abli-Code-1.0.0-mac-x64.zip` |

`Abli-Code-Setup-1.0.0.exe` is a single installer that picks x64 or ARM64 for you.

The Mac builds are unsigned. After unzipping, run `xattr -cr "Abli Code.app"` once (and `codesign --force --deep --sign - "Abli Code.app"` on Apple Silicon).

## What you get

- **Abliterated models in one place.** Switch models mid-thread from a single picker.
- **Desktop and web.** Same account, same threads, same look.
- **A real workspace.** Projects, recents, pinned and archived threads, rename, duplicate, export to Markdown.
- **Chat that works the way you expect.** Copy, edit and resend, regenerate, stop, markdown with copyable code blocks, photo and file attachments.
- **Sign in anywhere.** Google, GitHub, or email with a 6-digit code. On desktop, sign-in opens your default browser.
- **Pay in the app.** Stripe checkout inside the app, switch or cancel plans any time, top up credits.

## Models

| Model | Tier | Good for |
|---|---|---|
| Lite Mini | Free | Quick, light chat |
| Lite Chat | Free | Everyday chat |
| Abli Flash 3 | Cheap | Fast and small |
| Abli Flash 5 | Cheap | Fast, abliterated |
| Abli Flash 5.1 | Cheap | Faster and smarter than Flash 5 |
| Abli Coder 5 | Cheap | Coding |
| Abli Coder 5.1 | Premium | Stronger coding |
| Abli Coder 5.2 | Premium | Best at coding |
| Muse Spark Open | Premium | General use with image input |

Anything starting with **Abli** is abliterated. Within a family, a higher number is a smarter model. Flash is for speed, Coder is for code.

Muse Spark Open: Built with Muse Spark Open.

## Plans

| Plan | Price |
|---|---|
| Free | $0, with a shared daily token pool for free models |
| Plus | $20 / month |
| Pro | $50 / month |
| Max | $100 / month, bigger free pool, Flash 5 and 5.1 included in it |

You can also top up credits (minimum $5).

## Run it yourself

```bash
git clone https://github.com/umaralfatehsuhaimi02-rgb/abli-code.git
cd abli-code
npm install
cp .env.example .env     # then fill in your keys
npm run launch           # builds the web app and serves it on http://127.0.0.1:4747
npm run desktop          # opens the Electron app
```

| Script | What it does |
|---|---|
| `npm run dev:web` | Vite dev server |
| `npm run build` | Build the web bundle |
| `npm start` | Start the backend |
| `npm run launch` | Build, then start |
| `npm run desktop` | Run the Electron app |
| `npm run dist` | Build Windows installers and zips |
| `npm test` | Run the tests |

### Configuration

All keys live in `.env` on the server and nowhere else. See `.env.example` for every name. The main ones:

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
BREVO_API_KEY=
EMAIL_FROM=
<PROVIDER>_API_KEY=
```

The desktop app never contains provider keys. For production, host the server and set `desktop/backend.json` so the app talks to it. See [DEPLOY.md](DEPLOY.md). Profit maths is in [PROFIT.md](PROFIT.md).

## Building installers

`npm run dist` builds the Windows NSIS setup wizard and zips. The x86 build needs an older Electron because Electron 45 has no 32-bit Windows build:

```bash
npx electron-builder --win nsis zip --ia32 -c.electronVersion=43.8.12
```

Mac builds cannot be produced on Windows with electron-builder, so the Mac zips are assembled from the official Electron macOS builds with the app inside. A proper signed dmg needs a Mac or a macOS CI runner.

## License

MIT. Muse Spark Open is used under Meta's Muse Model License.