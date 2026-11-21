#!/usr/bin/env node
// Abli Code CLI: chat with Abli models from the terminal, with file, shell and web tools.
// Needs Node 18 or newer. No dependencies.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { exec } from 'node:child_process';

const VERSION = '1.0.4';
const CONF_DIR = path.join(os.homedir(), '.abli');
const CONF_FILE = path.join(CONF_DIR, 'config.json');
const FENCE = '`'.repeat(3);
const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const red = (s) => paint('38;2;255;42;67', s);
const dim = (s) => paint('2', s);
const bold = (s) => paint('1', s);

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONF_FILE, 'utf8')); } catch { return {}; }
}
function saveConfig(c) {
  fs.mkdirSync(CONF_DIR, { recursive: true });
  fs.writeFileSync(CONF_FILE, JSON.stringify(c, null, 2));
  try { fs.chmodSync(CONF_FILE, 0o600); } catch {}
}

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-m' || a === '--model') o.model = argv[++i];
    else if (a === '-y' || a === '--yes') o.yes = true;
    else if (a === '--no-tools') o.noTools = true;
    else if (a === '--search') o.search = true;
    else if (a === '--backend') o.backend = argv[++i];
    else if (a === '--email') o.email = argv[++i];
    else if (a === '--provider') o.provider = argv[++i];
    else if (a === '-v' || a === '--version') o.version = true;
    else if (a === '-h' || a === '--help') o.help = true;
    else o._.push(a);
  }
  return o;
}

const HELP = `${bold('Abli Code CLI')} ${VERSION}

Usage
  abli                       start an interactive chat
  abli "your question"       ask once and print the answer
  type notes.txt | abli "summarize"   pipe text in
  abli login                 sign in with Google in your browser
  abli login --provider github
  abli login --email you@example.com
  abli logout | whoami | models

Options
  -m, --model <slug>   pick a model (see: abli models)
  -y, --yes            let the model write files and run commands without asking
  --no-tools           chat only, no file or shell tools
  --search             attach web search results to your questions
  --backend <url>      Abli server to use (default http://127.0.0.1:4747)
  -v, --version   -h, --help

In the chat
  /help  /models  /model <slug>  /clear  /cd <dir>  /tools on|off  /search on|off
  /yes on|off  /save <file>  /whoami  /exit
  End a line with \\ to keep typing on the next line.`;

async function api(cfg, p, init = {}) {
  const headers = { 'Content-Type': 'application/json', ...(cfg.token ? { Authorization: 'Bearer ' + cfg.token } : {}), ...(init.headers || {}) };
  const res = await fetch(cfg.backend + p, { ...init, headers, signal: init.signal || AbortSignal.timeout(init.timeoutMs || 180000) });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const e = new Error((data && data.error) || `Request failed (${res.status})`);
    e.status = res.status;
    e.code = data && data.code;
    throw e;
  }
  return data;
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

function askHidden(q) {
  return new Promise((resolve) => {
    process.stdout.write(q);
    const stdin = process.stdin;
    let buf = '';
    const wasRaw = stdin.isRaw;
    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const cleanup = () => { stdin.removeListener('data', onData); if (stdin.setRawMode) stdin.setRawMode(Boolean(wasRaw)); stdin.pause(); };
    const onData = (chunk) => {
      for (const k of chunk) {
        if (k === '\r' || k === '\n') { cleanup(); process.stdout.write('\n'); resolve(buf); return; }
        if (k === '\u0003') { cleanup(); process.exit(130); }
        if (k === '\u007f' || k === '\b') buf = buf.slice(0, -1); else buf += k;
      }
    };
    stdin.on('data', onData);
  });
}

function askLine(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => { rl.close(); resolve(a); });
  });
}

async function cmdLogin(cfg, opts) {
  if (opts.email) {
    const password = await askHidden('Password: ');
    const r = await api(cfg, '/api/auth/login', { method: 'POST', body: JSON.stringify({ email: opts.email, password }) });
    saveConfig({ ...cfg, token: r.token });
    console.log(`Signed in as ${r.user?.email || opts.email}.`);
    return;
  }
  const provider = opts.provider === 'github' ? 'github' : 'google';
  const start = await api(cfg, `/api/auth/desktop/start?provider=${provider}`);
  console.log(`Opening your browser to sign in with ${provider === 'github' ? 'GitHub' : 'Google'}.`);
  console.log(dim('If it does not open, visit this link:'));
  console.log(start.url + '\n');
  openBrowser(start.url);
  const until = Date.now() + 5 * 60 * 1000;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 2000));
    const s = await api(cfg, `/api/auth/desktop/status?login=${encodeURIComponent(start.loginId)}`).catch(() => null);
    if (!s) continue;
    if (s.status === 'done' && s.token) {
      saveConfig({ ...cfg, token: s.token });
      console.log(`Signed in as ${s.user?.email || 'your account'}.`);
      return;
    }
    if (s.status === 'expired') break;
  }
  throw new Error('Sign in timed out. Run abli login again.');
}

async function getModels(cfg) {
  const cat = await api(cfg, '/api/public/catalog', { timeoutMs: 20000 });
  return (cat.models || []).filter((m) => m.providerReady !== false);
}

function pickModel(models, want) {
  if (want) {
    const w = String(want).toLowerCase();
    return models.find((m) => m.slug.toLowerCase() === w) || models.find((m) => m.name.toLowerCase() === w) || models.find((m) => m.slug.toLowerCase().includes(w) || m.name.toLowerCase().includes(w)) || null;
  }
  return models[0] || null;
}

function preface(cwd, toolsOn) {
  const base = `You are running inside Abli Code CLI, a terminal assistant. Be direct and concise. Current working directory: ${cwd}. OS: ${process.platform}.`;
  if (!toolsOn) return base;
  return base + `\nYou can act on the user's computer by emitting tool calls. To call a tool, output a fenced block exactly like this and then stop writing:\n${FENCE}abli-tool\n{"tool":"run_command","args":{"command":"dir"}}\n${FENCE}\nTools: read_file {path}, write_file {path, content}, list_dir {path}, run_command {command}, web_search {query}.\nOne tool call per reply. The result comes back in the next message; then continue, or answer normally when you are done. Paths are relative to the working directory. Never say you cannot access files or the computer, use the tools.`;
}

function trimHistory(hist, maxChars = 60000) {
  const out = [];
  let used = 0;
  for (let i = hist.length - 1; i >= 0; i--) {
    const len = String(hist[i].content).length;
    if (out.length && used + len > maxChars) break;
    out.unshift(hist[i]);
    used += len;
  }
  return out;
}

const TOOL_RE = new RegExp(FENCE + '(?:abli-tool|tool|json)\\s*\\n([\\s\\S]*?)' + FENCE);
function parseToolCall(text) {
  const m = TOOL_RE.exec(text);
  if (!m) return null;
  try {
    const j = JSON.parse(m[1].trim());
    if (j && typeof j.tool === 'string') return { tool: j.tool, args: j.args || {}, raw: m[0] };
  } catch {}
  return null;
}

function clip(s, n = 8000) {
  s = String(s);
  return s.length > n ? s.slice(0, n) + `\n... (${s.length - n} more characters cut)` : s;
}

async function permit(ctx, what) {
  if (ctx.yes) return true;
  if (!ctx.interactive) return false;
  const a = (await ctx.ask(`${red('?')} Allow ${what}? [y]es / [n]o / [a]lways  `)).trim().toLowerCase();
  if (a === 'a' || a === 'always') { ctx.yes = true; return true; }
  return a === 'y' || a === 'yes';
}

async function runTool(ctx, name, args) {
  const abs = (p) => path.resolve(ctx.cwd, String(p || '.'));
  try {
    if (name === 'read_file') return clip(fs.readFileSync(abs(args.path), 'utf8'));
    if (name === 'list_dir') {
      const items = fs.readdirSync(abs(args.path || '.'), { withFileTypes: true });
      return items.length ? items.map((d) => (d.isDirectory() ? '[dir]  ' : '       ') + d.name).join('\n') : '(empty folder)';
    }
    if (name === 'write_file') {
      const target = abs(args.path);
      if (!(await permit(ctx, `write ${target}`))) return 'Denied by the user. Do not retry; ask what to do instead.';
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const text = String(args.content ?? '');
      fs.writeFileSync(target, text);
      return `Wrote ${Buffer.byteLength(text)} bytes to ${target}`;
    }
    if (name === 'run_command') {
      const cmd = String(args.command || '');
      if (!cmd) return 'No command given.';
      if (!(await permit(ctx, `run: ${cmd}`))) return 'Denied by the user. Do not retry; ask what to do instead.';
      return await new Promise((resolve) => {
        exec(cmd, { cwd: ctx.cwd, timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
          const out = String(stdout || '') + (stderr ? '\n' + String(stderr) : '');
          resolve(clip(out.trim() || '(no output)') + (err && err.code != null ? `\n[exit code ${err.code}]` : err && err.killed ? '\n[timed out after 60s]' : ''));
        });
      });
    }
    if (name === 'web_search') {
      const r = await api(ctx.cfg, '/api/search?q=' + encodeURIComponent(String(args.query || '')), { timeoutMs: 15000 });
      const list = r.results || [];
      return list.length ? list.map((x, i) => `${i + 1}. ${x.title}\n   ${x.url}\n   ${x.snippet || ''}`).join('\n') : 'No results.';
    }
    return `Unknown tool ${name}.`;
  } catch (e) {
    return `Error: ${e && e.message ? e.message : e}`;
  }
}

function spinner(label) {
  if (!process.stderr.isTTY) return () => {};
  const frames = ['|', '/', '-', '\\'];
  let i = 0;
  const t = setInterval(() => process.stderr.write(`\r${red(frames[i++ % 4])} ${dim(label)}   `), 120);
  return () => { clearInterval(t); process.stderr.write('\r' + ' '.repeat(label.length + 8) + '\r'); };
}

async function complete(ctx) {
  const msgs = [
    { role: 'user', content: preface(ctx.cwd, ctx.tools) },
    { role: 'assistant', content: 'Understood.' },
    ...trimHistory(ctx.history)
  ];
  const stop = spinner(ctx.model.name + ' is thinking');
  try {
    const r = await api(ctx.cfg, '/api/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ modelSlug: ctx.model.slug, messages: msgs, enableTools: false, enabledServers: [] }),
      signal: ctx.abort ? ctx.abort.signal : undefined,
      timeoutMs: 240000
    });
    return String(r.content || '');
  } finally {
    stop();
  }
}

async function turn(ctx, text) {
  let content = text;
  if (ctx.search && text.length > 3) {
    try {
      const r = await api(ctx.cfg, '/api/search?q=' + encodeURIComponent(text.slice(0, 250)), { timeoutMs: 12000 });
      const list = r.results || [];
      if (list.length) content += '\n\nWeb search results (use them if relevant and cite the link):\n' + list.map((x, i) => `[${i + 1}] ${x.title} - ${x.url}\n${x.snippet || ''}`).join('\n');
    } catch {}
  }
  ctx.history.push({ role: 'user', content });
  for (let step = 0; step < 14; step++) {
    ctx.abort = new AbortController();
    const reply = await complete(ctx);
    const call = ctx.tools ? parseToolCall(reply) : null;
    const shown = call ? reply.replace(call.raw, '').trim() : reply.trim();
    if (shown) console.log('\n' + shown + '\n');
    ctx.history.push({ role: 'assistant', content: reply });
    if (!call) return;
    const detail = call.tool === 'run_command' ? call.args.command : call.args.path || call.args.query || '';
    console.log(dim(`[tool] ${call.tool} ${detail}`));
    const out = await runTool(ctx, call.tool, call.args);
    console.log(dim(clip(out, 600).split('\n').map((l) => '  ' + l).join('\n')));
    ctx.history.push({ role: 'user', content: `Tool result for ${call.tool}:\n${out}` });
  }
  console.log(dim('Stopped after 14 tool steps. Say continue to keep going.'));
}

async function readStdin() {
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function explain(e) {
  if (e && e.name === 'AbortError') return 'Cancelled.';
  if (e && e.status === 401) return 'You are not signed in. Run: abli login';
  if (e && e.status === 402) return e.message;
  if (e && e.cause && e.cause.code === 'ECONNREFUSED') return 'Cannot reach the Abli server. Start the Abli Code app, or pass --backend <url>.';
  return e && e.message ? e.message : String(e);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.version) { console.log(VERSION); return; }
  if (opts.help) { console.log(HELP); return; }
  const saved = loadConfig();
  const cfg = { ...saved, backend: String(opts.backend || process.env.ABLI_BACKEND_URL || saved.backend || 'http://127.0.0.1:4747').replace(/\/+$/, '') };
  const cmd = opts._[0];

  if (cmd === 'login') { await cmdLogin(cfg, opts); if (opts.backend) saveConfig({ ...loadConfig(), backend: cfg.backend }); return; }
  if (cmd === 'logout') { const c = loadConfig(); delete c.token; saveConfig(c); console.log('Signed out.'); return; }
  if (cmd === 'models') {
    const models = await getModels(cfg);
    for (const m of models) console.log(`${m.slug.padEnd(28)} ${m.name}${m.speedBadge ? '  (' + m.speedBadge + ')' : ''}`);
    return;
  }
  if (cmd === 'whoami') {
    const r = await api(cfg, '/api/auth/me');
    console.log(`${r.user.email}  plan: ${r.user.plan}`);
    return;
  }
  if (cmd === 'help') { console.log(HELP); return; }

  if (!cfg.token) { console.error('You are not signed in. Run: abli login'); process.exit(1); }
  const models = await getModels(cfg);
  const model = pickModel(models, opts.model || saved.model);
  if (!model) { console.error(opts.model ? `No model matches "${opts.model}". Run: abli models` : 'No models are available right now.'); process.exit(1); }

  const piped = await readStdin();
  const promptArg = (cmd === 'chat' ? opts._.slice(1) : opts._).join(' ').trim();
  const oneShot = Boolean(promptArg || piped.trim());

  const ctx = {
    cfg, model, models,
    cwd: process.cwd(),
    history: [],
    tools: !opts.noTools,
    search: Boolean(opts.search),
    yes: Boolean(opts.yes),
    interactive: !oneShot && Boolean(process.stdin.isTTY),
    ask: askLine,
    abort: null
  };

  if (oneShot) {
    const text = [promptArg, piped.trim()].filter(Boolean).join('\n\n');
    await turn(ctx, text);
    return;
  }

  console.log(`${red(bold('Abli Code'))} ${dim('CLI ' + VERSION)}  ${dim('model')} ${model.name}  ${dim('folder')} ${ctx.cwd}`);
  console.log(dim('Type /help for commands. Ctrl+C cancels a reply, Ctrl+D exits.\n'));
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: red('> ') });
  ctx.ask = (q) => new Promise((resolve) => rl.question(q, resolve));
  let busy = false;
  rl.on('SIGINT', () => {
    if (busy && ctx.abort) { ctx.abort.abort(); return; }
    rl.close();
  });
  rl.prompt();
  let pending = '';
  for await (const line of rl) {
    if (line.endsWith('\\')) { pending += line.slice(0, -1) + '\n'; continue; }
    const text = (pending + line).trim();
    pending = '';
    if (!text) { rl.prompt(); continue; }
    if (text.startsWith('/')) {
      const [c, ...rest] = text.slice(1).split(/\s+/);
      const arg = rest.join(' ');
      const onoff = (v) => !/^(off|0|false|no)$/i.test(v || 'on');
      if (c === 'exit' || c === 'quit') break;
      else if (c === 'help') console.log(HELP);
      else if (c === 'clear') { ctx.history = []; console.log('Conversation cleared.'); }
      else if (c === 'models') models.forEach((m) => console.log(`${m.slug.padEnd(28)} ${m.name}${m.slug === ctx.model.slug ? '  <- current' : ''}`));
      else if (c === 'model') {
        const m = pickModel(models, arg);
        if (!m) console.log('No model matches that. Try /models');
        else { ctx.model = m; saveConfig({ ...loadConfig(), model: m.slug }); console.log(`Using ${m.name}.`); }
      }
      else if (c === 'cd') {
        const t = path.resolve(ctx.cwd, arg || '.');
        if (fs.existsSync(t) && fs.statSync(t).isDirectory()) { ctx.cwd = t; console.log(t); } else console.log('Not a folder.');
      }
      else if (c === 'tools') { ctx.tools = onoff(arg); console.log('Tools ' + (ctx.tools ? 'on' : 'off')); }
      else if (c === 'search') { ctx.search = onoff(arg); console.log('Web search ' + (ctx.search ? 'on' : 'off')); }
      else if (c === 'yes') { ctx.yes = onoff(arg); console.log(ctx.yes ? 'Auto-approve on: the model can write files and run commands without asking.' : 'Auto-approve off.'); }
      else if (c === 'save') {
        const f = path.resolve(ctx.cwd, arg || 'abli-chat.md');
        fs.writeFileSync(f, ctx.history.map((m) => `**${m.role === 'user' ? 'You' : ctx.model.name}**\n\n${m.content}\n`).join('\n'));
        console.log('Saved to ' + f);
      }
      else if (c === 'whoami') { try { const r = await api(cfg, '/api/auth/me'); console.log(`${r.user.email}  plan: ${r.user.plan}`); } catch (e) { console.log(explain(e)); } }
      else console.log('Unknown command. Try /help');
      rl.prompt();
      continue;
    }
    busy = true;
    try { await turn(ctx, text); } catch (e) { console.log(red(explain(e))); }
    busy = false;
    rl.prompt();
  }
  rl.close();
}

main().catch((e) => { console.error(explain(e)); process.exit(1); });
