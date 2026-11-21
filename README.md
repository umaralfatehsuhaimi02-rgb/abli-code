# Abli Code

**Open-source (MIT) Abliterated AI IDE, Terminal CLI, Supabase + Stripe SaaS Gateway, and Stock REA (Reverse Engineer Anything) MCP Server.**

Built with a **Black / White / Red** aesthetic. Zero-code launch: open **Operator Setup**, paste your platform API keys (OpenRouter, Chutes, DeepInfra, Together, Fireworks, Hugging Face, Ollama/vLLM, or custom OpenAI-compatible) + Stripe + Resend keys, and go live.

## Features
- **Abliterated Model Router**: Pre-configured for **DeepSeek Abliterated** (Free up to **1,500,000 tokens/day** UTC hard stop), **GLM 5.3 Flash Abliterated**, **GLM 5.3 Abliterated**, **Qwen Abliterated**, and **Kimi Abliterated**.
- **Subscriptions & 150% Spend Cap + Stripe Top-Ups**:
  - **Free** ($0): DeepSeek Abliterated up to 1.5M tokens/day.
  - **Plus** ($20/mo): Hard spend cap at **$30.00 (150%)**.
  - **Pro** ($50/mo): Hard spend cap at **$75.00 (150%)**.
  - **Max** ($100/mo): Hard spend cap at **$150.00 (150%)** before hard stop & upgrade/top-up prompt.
  - **Credit Top-Ups**: +$10, +$25, +$50, +$100 via Stripe Checkout.
- **Supabase Auth + Custom 6-Digit Verification Codes**: GitHub & Google OAuth plus regular email/password signup verified with a custom 6-digit email code.
- **Desktop App + Computer Control**: Electron desktop IDE (`npm run desktop`) with native shell execution, file read/write, window enumeration, screen capture, mouse & keyboard control.
- **Abli Code Terminal (`abli`)**: Interactive CLI & REPL (`node bin/abli.mjs`) with `/rea`, `/mcp`, `/run`, `/models`, and `/usage`.
- **Stock REA MCP Server + External MCP Hub**: Built-in stdio (`node mcp/rea-server.mjs`) and Streamable HTTP (`/mcp`) Reverse Engineer Anything MCP server (PE/ELF/WASM inspection, Shannon entropy, strings/URL/IPC extraction, disassembly, codebase mapping, and clean-room rebuild blueprints), plus mount any external stdio/HTTP MCP server.
- **Compliance & SEO**: Terms of Service, Privacy Policy, Acceptable Use Policy, Cookie Policy + Consent Banner, `robots.txt`, `sitemap.xml`, and contact wired to `umaralfatehsuhaimi02@gmail.com`.

## Quickstart
```bash
npm install
npm run build
npm start        # Launches landing page + API + HTTP MCP on http://127.0.0.1:4747
npm run desktop  # Launches the Electron Desktop App
node bin/abli.mjs # Launches Abli Code Terminal
```

## License
MIT License — Copyright (c) 2026 Umar Al-Fateh Suhaimi (`umaralfatehsuhaimi02@gmail.com`)
