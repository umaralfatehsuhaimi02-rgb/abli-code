# Abli Code

**Open-source (MIT) AI Coding Desktop App, Web Workspace, Supabase + Stripe Gateway, Computer Control & MCP Hub.**

Built with a smooth **Black / White / Red** aesthetic. Plug in your API keys (OpenRouter, Chutes, DeepInfra, Together, Fireworks, Hugging Face, Ollama/vLLM, or custom OpenAI-compatible) + Stripe + Resend in **API Keys** and launch immediately.

## Highlights
- **Multi-Model Switcher**: Switch mid-thread between **Free** models (750K tokens/day per model: DeepSeek V3, GLM 4.5 Flash Free, Qwen3 Coder Free, Llama 3.3 70B Free), **Cheap & Fast** models (GLM 5.3 Flash, Qwen3 Coder 30B, DeepSeek R1 Distill, Gemma 3 27B), and **Flagship** models (GLM 5.3, Qwen3 Max, Kimi K2).
- **Codex-Style Desktop App**: Clean Electron desktop app (`npm run desktop`) with custom app icon, thread sidebar, project folder picker, inline tool trace cards, and composer popovers for model switching & MCP tools.
- **MCP Support + Computer Control**: Built-in workspace/binary analysis MCP server (`/mcp`) and Computer Control tools (shell, files, windows, screen capture), plus add any custom stdio or HTTP MCP server.
- **Supabase Auth + Stripe Billing**: GitHub & Google OAuth, regular email/password login with custom 6-digit verification codes, Free/Plus/Pro/Max plans, and Stripe Checkout credit top-ups.
- **Compliance & SEO**: Terms, Privacy, Acceptable Use, Cookie Policy + Consent Banner, `robots.txt`, `sitemap.xml`, and support via `umaralfatehsuhaimi02@gmail.com`.

## Quickstart
```bash
npm install
npm run build
npm start        # Launches landing page + API + HTTP MCP on http://127.0.0.1:4747
npm run desktop  # Launches the Electron Desktop App
```

## License
MIT License - Copyright (c) 2026 Umar Al-Fateh Suhaimi (`umaralfatehsuhaimi02@gmail.com`)
