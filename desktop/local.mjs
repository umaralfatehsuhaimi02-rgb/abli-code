// Abli Mini: runs abliterated models on the user's own computer.
// Everything here runs in the desktop app's main process. Nothing is sent to any server.
import { app, session } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const RELEASE = 'prism-b10828-a153697';
const RT = `https://github.com/PrismML-Eng/llama.cpp/releases/download/${RELEASE}/`;
const HF = 'https://huggingface.co/';
const base = (size) => `${HF}prism-ml/Ternary-Bonsai-2-${size}-gguf/resolve/main/Ternary-Bonsai-2-${size}-PTQ1_0.gguf`;
const lora = (size) => `${HF}AtomicChat/Ternary-Bonsai-2-${size}-Uncensored-LoRA-GGUF/resolve/main/Ternary-Bonsai-2-${size}-Uncensored-LoRA.gguf`;

// needGb: memory the model needs while running (weights + context). A PC also needs headroom for Windows itself.
export const LOCAL_MODELS = [
  {
    id: 'lite', name: 'Abli Mini Lite', size: '2B', downloadGb: 0.45, needGb: 2.0, thinking: 'off',
    files: [{ url: base('2B'), name: 'model.gguf' }, { url: lora('2B'), name: 'adapter.gguf', adapter: true }]
  },
  {
    id: 'flash', name: 'Abli Mini Flash', size: '4B', downloadGb: 0.95, needGb: 2.5, thinking: 'off',
    files: [{ url: base('4B'), name: 'model.gguf' }, { url: lora('4B'), name: 'adapter.gguf', adapter: true }]
  },
  {
    id: 'coder', name: 'Abli Mini Coder', size: '9B', downloadGb: 2.0, needGb: 4.0, thinking: 'off',
    files: [{ url: base('9B'), name: 'model.gguf' }, { url: lora('9B'), name: 'adapter.gguf', adapter: true }]
  },
  {
    id: 'coder2', name: 'Abli Mini Coder 2', size: '27B', downloadGb: 5.7, needGb: 8.5, thinking: 'medium',
    files: [{ url: `${HF}BoldingBuilds/Ternary-Bonsai-2-27B-Abliterated-v2-PTQ1_0-GGUF/resolve/main/Ternary-Bonsai-2-27B-Abliterated-v2-PTQ1_0.gguf`, name: 'model.gguf' }]
  }
];

const HEADROOM_GB = 2.5; // memory left for the operating system and other apps

const S = { installing: '', progress: null, running: null, error: '', cancel: null, child: null, log: '', key: '' };
let deviceCache = null;

function dirs() {
  const root = path.join(app.getPath('userData'), 'local');
  return { root, bin: (b) => path.join(root, 'bin', b), model: (id) => path.join(root, 'models', id), dl: path.join(root, 'downloads') };
}

function run(cmd, args, timeout = 9000) {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, out) => resolve(err ? '' : String(out)));
  });
}

async function nvidiaSmi(args) {
  const candidates = ['nvidia-smi', path.join(process.env.ProgramFiles || 'C:\\Program Files', 'NVIDIA Corporation', 'NVSMI', 'nvidia-smi.exe'), path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'nvidia-smi.exe')];
  for (const c of candidates) {
    const out = await run(c, args);
    if (out) return out;
  }
  return '';
}

async function detectGpu() {
  const gpus = [];
  const nv = await nvidiaSmi(['--query-gpu=name,memory.total', '--format=csv,noheader,nounits']);
  let cuda = 0;
  if (nv) {
    for (const line of nv.split(/\r?\n/).filter(Boolean)) {
      const [name, mem] = line.split(',').map((s) => s.trim());
      gpus.push({ name, vramGb: Math.round((Number(mem) / 1024) * 10) / 10, vendor: 'nvidia' });
    }
    const full = await nvidiaSmi([]);
    const m = /CUDA(?:\s+UMD)?\s+Version:\s+(\d+)\.(\d+)/.exec(full);
    if (m) cuda = Number(m[1]) + Number(m[2]) / 100;
  }
  const cim = await run('powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM | ConvertTo-Json -Compress']);
  try {
    let list = JSON.parse(cim || '[]');
    if (!Array.isArray(list)) list = [list];
    for (const g of list) {
      const name = String(g.Name || '');
      if (!name || (/nvidia/i.test(name) && gpus.some((x) => x.vendor === 'nvidia'))) continue;
      if (/microsoft basic|remote display|virtual/i.test(name)) continue;
      const ram = Number(g.AdapterRAM || 0);
      // AdapterRAM is capped near 4 GB by Windows, so a value at the cap means "4 GB or more, exact size unknown".
      const capped = ram >= 4290000000;
      gpus.push({ name, vramGb: capped ? null : Math.round((ram / 1024 ** 3) * 10) / 10, vendor: /amd|radeon/i.test(name) ? 'amd' : /intel/i.test(name) ? 'intel' : 'other' });
    }
  } catch {}
  return { gpus, cuda };
}

async function getDevice(force = false) {
  if (!force && deviceCache && Date.now() - deviceCache.at < 30000) return deviceCache.data;
  const { root } = dirs();
  fs.mkdirSync(root, { recursive: true });
  let freeDiskGb = 0;
  try {
    const st = fs.statfsSync(root);
    freeDiskGb = Math.round(((st.bavail * st.bsize) / 1024 ** 3) * 10) / 10;
  } catch {}
  const cpus = os.cpus();
  const { gpus, cuda } = await detectGpu();
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  // Best graphics card: NVIDIA first, then a discrete AMD or Intel Arc card.
  const nvidia = gpus.filter((g) => g.vendor === 'nvidia').sort((a, b) => (b.vramGb || 0) - (a.vramGb || 0))[0];
  const other = gpus.find((g) => /radeon rx|radeon pro|radeon vii|arc/i.test(g.name));
  let backend = 'cpu';
  let gpu = null;
  if (arch === 'x64' && nvidia && cuda >= 12.04) { backend = 'cuda'; gpu = nvidia; }
  else if (arch === 'x64' && (nvidia || other)) { backend = 'vulkan'; gpu = nvidia || other; }
  const data = {
    os: `Windows ${os.release()} (${arch})`,
    cpu: (cpus[0]?.model || 'Unknown CPU').replace(/\s+/g, ' ').trim(),
    cores: cpus.length,
    ramGb: Math.round((os.totalmem() / 1024 ** 3) * 10) / 10,
    freeDiskGb,
    gpus: gpus.map((g) => ({ name: g.name, vramGb: g.vramGb })),
    gpu: gpu ? { name: gpu.name, vramGb: gpu.vramGb ?? 4 } : null,
    backend,
    arch
  };
  deviceCache = { at: Date.now(), data };
  return data;
}

function runtimeReady(backend) {
  const bin = dirs().bin(backend);
  try {
    return fs.readFileSync(path.join(bin, '.release'), 'utf8').trim() === RELEASE && Boolean(findExe(bin));
  } catch { return false; }
}

function engineInfo(dev) {
  const mb = { cpu: dev.arch === 'arm64' ? 12 : 19, vulkan: 49, cuda: 683 }[dev.backend];
  const label = { cpu: 'processor', vulkan: 'graphics card (Vulkan)', cuda: 'NVIDIA graphics card (CUDA)' }[dev.backend];
  return { backend: dev.backend, label, mb, installed: runtimeReady(dev.backend) };
}

function rate(m, dev) {
  const vram = dev.gpu ? dev.gpu.vramGb : 0;
  const gpuOk = dev.backend !== 'cpu' && vram >= m.needGb;
  const ramOk = dev.ramGb >= m.needGb + HEADROOM_GB;
  const diskOk = dev.freeDiskGb >= m.downloadGb + 0.8;
  let level; let label; let reason;
  if (gpuOk) {
    level = 'great'; label = 'Runs great'; reason = `Runs on your graphics card (${dev.gpu.name}). Fast replies.`;
  } else if (ramOk) {
    if (m.id === 'coder2') { level = 'slow'; label = 'Runs, but slow'; reason = 'Runs on your processor. Expect a few words per second.'; }
    else if (m.id === 'coder') { level = 'ok'; label = 'Runs fine'; reason = 'Runs on your processor at a comfortable speed.'; }
    else { level = 'good'; label = 'Runs well'; reason = 'Light enough to run quickly on your processor.'; }
  } else {
    level = 'no'; label = 'Not enough memory';
    reason = `Needs about ${(m.needGb + HEADROOM_GB).toFixed(1)} GB of memory. This PC has ${dev.ramGb} GB.`;
  }
  if (level !== 'no' && !diskOk) {
    reason = `Needs about ${(m.downloadGb + 0.8).toFixed(1)} GB of free disk space. You have ${dev.freeDiskGb} GB.`;
    level = 'no'; label = 'Not enough disk space';
  }
  return { level, label, reason, canRun: level !== 'no', onGpu: gpuOk };
}

function modelInstalled(m) {
  const d = dirs().model(m.id);
  return m.files.every((f) => fs.existsSync(path.join(d, f.name)));
}

function findExe(dir) {
  const walk = (d, depth) => {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return null; }
    for (const e of entries) if (e.isFile() && e.name.toLowerCase() === 'llama-server.exe') return path.join(d, e.name);
    if (depth > 0) for (const e of entries) if (e.isDirectory()) { const r = walk(path.join(d, e.name), depth - 1); if (r) return r; }
    return null;
  };
  return walk(dir, 2);
}

function runtimeZips(dev) {
  const a = dev.arch;
  if (dev.backend === 'cuda') return [`llama-${RELEASE}-bin-win-cuda-12.4-x64.zip`, 'cudart-llama-bin-win-cuda-12.4-x64.zip'];
  if (dev.backend === 'vulkan') return [`llama-${RELEASE}-bin-win-cpu-x64.zip`, `llama-${RELEASE}-bin-win-vulkan-x64.zip`];
  return [`llama-${RELEASE}-bin-win-cpu-${a}.zip`];
}

async function headSize(url, signal) {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal });
  if (!res.ok) throw new Error(`Could not reach the download server (${res.status}).`);
  return Number(res.headers.get('content-length') || 0);
}

async function downloadFile(url, dest, signal, onBytes) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const part = dest + '.part';
  let have = 0;
  try { have = fs.statSync(part).size; } catch {}
  const res = await fetch(url, { headers: have ? { Range: `bytes=${have}-` } : {}, redirect: 'follow', signal });
  if (res.status === 416) { fs.renameSync(part, dest); return; }
  if (!res.ok && res.status !== 206) throw new Error(`Download failed (${res.status}).`);
  if (res.status === 200 && have) { have = 0; }
  const out = fs.createWriteStream(part, { flags: have ? 'a' : 'w' });
  const body = Readable.fromWeb(res.body);
  body.on('data', (c) => onBytes(c.length));
  await pipeline(body, out, { signal });
  fs.renameSync(part, dest);
}

async function extractZip(zip, into) {
  fs.mkdirSync(into, { recursive: true });
  const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  let ok = await new Promise((resolve) => execFile(tar, ['-xf', zip, '-C', into], { windowsHide: true, timeout: 300000 }, (err) => resolve(!err)));
  if (!ok) {
    ok = await new Promise((resolve) => execFile('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${into}' -Force`], { windowsHide: true, timeout: 300000 }, (err) => resolve(!err)));
  }
  if (!ok) throw new Error('Could not unpack the engine files.');
}

async function install(id) {
  const m = LOCAL_MODELS.find((x) => x.id === id);
  if (!m) throw new Error('Unknown model.');
  if (S.installing) throw new Error('Another install is already running.');
  const dev = await getDevice();
  const r = rate(m, dev);
  if (!r.canRun) throw new Error(r.reason);
  const d = dirs();
  const backend = dev.backend;
  S.installing = id; S.error = ''; S.cancel = new AbortController();
  const signal = S.cancel.signal;
  (async () => {
    try {
      const plan = [];
      if (!runtimeReady(backend)) {
        for (const z of runtimeZips(dev)) plan.push({ url: RT + z, dest: path.join(d.dl, z), label: 'Downloading the engine', zip: true });
      }
      for (const f of m.files) {
        const dest = path.join(d.model(m.id), f.name);
        if (!fs.existsSync(dest)) plan.push({ url: f.url, dest, label: `Downloading ${m.name}` });
      }
      let total = 0; let received = 0;
      for (const p of plan) {
        p.size = await headSize(p.url, signal);
        total += p.size;
        try { received += fs.statSync(p.dest + '.part').size; } catch {}
      }
      S.progress = { label: plan[0]?.label || 'Getting ready', received, total };
      for (const p of plan) {
        S.progress = { label: p.label, received, total };
        await downloadFile(p.url, p.dest, signal, (n) => { received += n; S.progress = { label: p.label, received, total }; });
      }
      if (plan.some((p) => p.zip)) {
        S.progress = { label: 'Setting up the engine', received: total, total };
        const bin = d.bin(backend);
        fs.rmSync(bin, { recursive: true, force: true });
        for (const p of plan.filter((x) => x.zip)) { await extractZip(p.dest, bin); fs.rmSync(p.dest, { force: true }); }
        if (!findExe(bin)) throw new Error('The engine was downloaded but is missing its server file.');
        fs.writeFileSync(path.join(bin, '.release'), RELEASE);
      }
    } catch (e) {
      if (e?.name === 'AbortError' || signal.aborted) S.error = '';
      else S.error = String(e?.message || e).slice(0, 300);
    } finally {
      S.installing = ''; S.progress = null; S.cancel = null;
    }
  })();
  return { ok: true };
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
  });
}

function killChild() {
  const c = S.child;
  S.child = null; S.running = null; S.key = '';
  if (c && c.pid) {
    try { execFile('taskkill', ['/T', '/F', '/PID', String(c.pid)], { windowsHide: true }, () => {}); } catch {}
    try { c.kill(); } catch {}
  }
}

async function start(id) {
  const m = LOCAL_MODELS.find((x) => x.id === id);
  if (!m) throw new Error('Unknown model.');
  if (S.running && S.running.id === id && S.running.ready) return { ok: true };
  killChild();
  if (!modelInstalled(m)) throw new Error(`${m.name} is not installed yet.`);
  const dev = await getDevice();
  const exe = findExe(dirs().bin(dev.backend));
  if (!exe || !runtimeReady(dev.backend)) throw new Error('The engine is not installed yet.');
  const r = rate(m, dev);
  const port = await freePort();
  const key = crypto.randomBytes(16).toString('hex');
  const md = dirs().model(m.id);
  const args = ['-m', path.join(md, 'model.gguf')];
  if (m.files.some((f) => f.adapter)) args.push('--lora', path.join(md, 'adapter.gguf'));
  args.push('--host', '127.0.0.1', '--port', String(port), '-c', '8192', '-np', '1', '-ngl', r.onGpu ? '99' : '0', '--api-key', key, '--jinja');
  S.log = ''; S.error = '';
  const child = spawn(exe, args, { cwd: path.dirname(exe), windowsHide: true, env: { ...process.env, PATH: `${path.dirname(exe)};${process.env.PATH}` } });
  S.child = child; S.key = key; S.running = { id, port, ready: false };
  const keep = (b) => { S.log = (S.log + String(b)).slice(-4000); };
  child.stdout.on('data', keep); child.stderr.on('data', keep);
  child.on('exit', () => {
    if (S.child === child) {
      const wasReady = S.running?.ready;
      S.child = null; S.running = null; S.key = '';
      if (!wasReady) S.error = `${m.name} could not start. ${S.log.split(/\r?\n/).filter(Boolean).slice(-2).join(' ').slice(0, 220)}`;
    }
  });
  const t0 = Date.now();
  while (Date.now() - t0 < 300000) {
    if (S.child !== child) throw new Error(S.error || `${m.name} could not start.`);
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) {
        if (m.files.some((f) => f.adapter)) {
          // These models are only abliterated through the adapter. Make sure it is loaded and fully on, or refuse to run.
          const auth = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
          const adapterOn = async () => {
            const lr = await fetch(`http://127.0.0.1:${port}/lora-adapters`, { headers: auth });
            if (!lr.ok) return false;
            const list = await lr.json();
            return Array.isArray(list) && list.length > 0 && list.every((x) => Number(x.scale) > 0.99);
          };
          let on = false;
          try { on = await adapterOn(); } catch {}
          if (!on) {
            try { await fetch(`http://127.0.0.1:${port}/lora-adapters`, { method: 'POST', headers: auth, body: JSON.stringify([{ id: 0, scale: 1.0 }]) }); on = await adapterOn(); } catch {}
          }
          if (!on) {
            killChild();
            S.error = `${m.name} was not started: its abliteration adapter did not load, so it would not be uncensored. Remove and reinstall it from Abli Mini.`;
            throw new Error(S.error);
          }
        }
        S.running.ready = true;
        return { ok: true };
      }
    } catch {}
    await new Promise((x) => setTimeout(x, 600));
  }
  killChild();
  throw new Error(`${m.name} took too long to load.`);
}

async function status() {
  const dev = await getDevice();
  return {
    installed: Object.fromEntries(LOCAL_MODELS.map((m) => [m.id, modelInstalled(m)])),
    engine: engineInfo(dev),
    installing: S.installing,
    progress: S.progress,
    running: S.running ? { id: S.running.id, ready: S.running.ready } : null,
    error: S.error
  };
}

export async function checkDevice() {
  const dev = await getDevice(true);
  const models = LOCAL_MODELS.map((m) => ({ id: m.id, name: m.name, size: m.size, downloadGb: m.downloadGb, needGb: m.needGb, ...rate(m, dev) }));
  const best = [...models].reverse().find((m) => m.canRun) || null;
  return { device: dev, engine: engineInfo(dev), models, bestId: best ? best.id : null };
}

export function registerLocal(handle) {
  // The page runs on 127.0.0.1:4747 (or a hosted address) and talks to the local engine on another port.
  // Chromium asks for this extra permission when a page calls a local address.
  try {
    session.defaultSession.webRequest.onHeadersReceived({ urls: ['http://127.0.0.1:*/*'] }, (details, cb) => {
      const headers = details.responseHeaders || {};
      headers['Access-Control-Allow-Private-Network'] = ['true'];
      cb({ responseHeaders: headers });
    });
  } catch {}
  handle('local:check', () => checkDevice());
  handle('local:status', () => status());
  handle('local:install', (_ev, id) => install(String(id)));
  handle('local:cancel', () => { try { S.cancel?.abort(); } catch {} return { ok: true }; });
  handle('local:start', (_ev, id) => start(String(id)));
  handle('local:stop', () => { killChild(); return { ok: true }; });
  handle('local:remove', (_ev, id) => {
    const m = LOCAL_MODELS.find((x) => x.id === String(id));
    if (!m) return { ok: false };
    if (S.running?.id === m.id) killChild();
    fs.rmSync(dirs().model(m.id), { recursive: true, force: true });
    return { ok: true };
  });
  handle('local:endpoint', () => (S.running?.ready ? { url: `http://127.0.0.1:${S.running.port}`, key: S.key, id: S.running.id } : null));
  app.on('before-quit', killChild);
}

export const __test = { downloadFile, extractZip, findExe, RT, RELEASE };

