import { app, BrowserWindow, dialog, ipcMain, nativeImage, nativeTheme, session, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { spawn as spawnUpd } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { executeComputerTool } from '../lib/computer-control.mjs';
import { executeReaTool } from '../mcp/rea-server.mjs';
import { registerLocal } from './local.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const ICON_PATH = path.join(ROOT_DIR, 'public', process.platform === 'win32' ? 'icon.ico' : 'icon.png');

app.setName('Abli Code');
nativeTheme.themeSource = 'dark';

// Write browser storage (session token, preferences) to disk often, so a hard close never loses the login.
setInterval(() => {
  try { session.defaultSession.flushStorageData(); } catch {}
}, 4000);
app.on('before-quit', () => {
  try { session.defaultSession.flushStorageData(); } catch {}
});
if (process.platform === 'win32') {
  app.setAppUserModelId('com.ablicode.desktop');
}

let mainWindow = null;
const localPort = Number(process.env.PORT || 4747);
let serverInstance = null;

// Hosted mode: when a backend URL is set, this app is only a client. It never runs a server and
// holds no provider keys. Set it in desktop/backend.json (shipped in the installer) or ABLI_BACKEND_URL.
function readBackendUrl() {
  let url = String(process.env.ABLI_BACKEND_URL || '').trim();
  if (!url) {
    try {
      url = String(JSON.parse(fs.readFileSync(path.join(__dirname, 'backend.json'), 'utf8')).backendUrl || '').trim();
    } catch {}
  }
  url = url.replace(/\/+$/, '');
  const ok = /^https:\/\//i.test(url) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(url);
  return ok ? url : '';
}

const BACKEND_URL = readBackendUrl();
const APP_ORIGIN = BACKEND_URL ? new URL(BACKEND_URL).origin : `http://127.0.0.1:${localPort}`;

async function startEmbeddedServer() {
  // Local mode keeps its data in the user's profile folder, not inside the read-only app package.
  process.env.ABLI_DATA_DIR = process.env.ABLI_DATA_DIR || path.join(app.getPath('userData'), 'data');
  const { createAbliServer } = await import('../server.mjs');
  const srv = createAbliServer();
  return new Promise((resolve) => {
    srv.on('error', () => resolve(null));
    srv.listen(localPort, '127.0.0.1', () => {
      serverInstance = srv;
      resolve(srv);
    });
  });
}

// Only the app's own page may use the native bridge (shell, files, dialogs).
function isTrusted(ev) {
  try {
    return new URL(ev.senderFrame?.url || ev.sender.getURL()).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function handle(channel, fn) {
  ipcMain.handle(channel, async (ev, ...args) => {
    if (!isTrusted(ev)) throw new Error('Blocked: this request did not come from the Abli Code app.');
    return fn(ev, ...args);
  });
}

// Actions that change things or reveal the screen need a yes from the person at the keyboard.
const NEEDS_APPROVAL = {
  computer_run_shell: 'run a command on your computer',
  computer_write_file: 'create or overwrite a file',
  computer_mouse_click: 'click with your mouse',
  computer_type_text: 'type with your keyboard',
  computer_screenshot: 'take a screenshot of your screen'
};
const approvedThisSession = new Set();

async function askApproval(toolName, args) {
  if (approvedThisSession.has(toolName)) return true;
  const detail = JSON.stringify(args || {}, null, 2).slice(0, 800);
  const res = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Allow once', 'Allow for this session', 'Deny'],
    defaultId: 2,
    cancelId: 2,
    noLink: true,
    title: 'Abli Code',
    message: `Abli Code wants to ${NEEDS_APPROVAL[toolName]}.`,
    detail
  });
  if (res.response === 1) approvedThisSession.add(toolName);
  return res.response !== 2;
}

// Pages other than the app itself (for example Stripe checkout) may load in the window,
// but anything else opens in the default browser.
const INWINDOW_HOSTS = [/(^|\.)stripe\.com$/];
const SIGNIN_HOSTS = [/(^|\.)github\.com$/, /(^|\.)google\.com$/, /\.supabase\.co$/];

function createWindow() {
  const appIcon = nativeImage.createFromPath(ICON_PATH);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1020,
    minHeight: 680,
    title: 'Abli Code',
    icon: appIcon.isEmpty() ? ICON_PATH : appIcon,
    backgroundColor: '#060608',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#060608', symbolColor: '#ffffff', height: 36 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (!appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
  }
  mainWindow.setTitle('Abli Code');
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
    mainWindow?.setTitle('Abli Code');
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol) || u.origin === APP_ORIGIN) return;
      if (SIGNIN_HOSTS.some((re) => re.test(u.hostname)) || !INWINDOW_HOSTS.some((re) => re.test(u.hostname))) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {}
  });
  // Card checks, wallets and Link open small popups. They have to stay inside the app, or the payment form waits forever.
  const PAYMENT_POPUP_HOSTS = [/(^|\.)stripe\.com$/, /(^|\.)stripe\.network$/, /(^|\.)link\.com$/, /(^|\.)google\.com$/, /(^|\.)paypal\.com$/, /(^|\.)hcaptcha\.com$/];
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      if (url === 'about:blank' || (u.protocol === 'https:' && PAYMENT_POPUP_HOSTS.some((re) => re.test(u.hostname)))) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: { parent: mainWindow, modal: true, width: 520, height: 720, autoHideMenuBar: true, backgroundColor: '#ffffff', webPreferences: { contextIsolation: true, nodeIntegration: false } }
        };
      }
      if (/^https?:$/.test(u.protocol)) shell.openExternal(url);
    } catch {}
    return { action: 'deny' };
  });

  mainWindow.loadURL(`${APP_ORIGIN}/?desktop=1#/app`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function cmpVer(a, b) {
  const x = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const y = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1; }
  return 0;
}

// Update state, shown in the app as an "Update to vX" button. The download starts only when the user clicks it.
let upd = { phase: 'idle', version: '', error: '' };
let updAsset = null;
function setUpd(p) { upd = { ...upd, ...p }; try { mainWindow?.webContents.send('update:state', upd); } catch {} }
let updEtag = '';
let lastUpdCheck = 0;
async function checkForUpdate() {
  if (!app.isPackaged || upd.phase === 'downloading' || upd.phase === 'installing') return;
  if (Date.now() - lastUpdCheck < 15000) return;
  lastUpdCheck = Date.now();
  const r = await fetch('https://api.github.com/repos/umaralfatehsuhaimi02-rgb/abli-code/releases/latest', { headers: { 'User-Agent': 'abli-code', Accept: 'application/vnd.github+json', ...(updEtag ? { 'If-None-Match': updEtag } : {}) } });
  if (r.status === 304) return;
  if (!r.ok) return;
  updEtag = r.headers.get('etag') || '';
  const rel = await r.json();
  const latest = String(rel.tag_name || '').replace(/^v/, '');
  if (!latest || cmpVer(latest, app.getVersion()) <= 0) return;
  const arch = process.arch === 'arm64' ? 'arm64' : process.arch === 'ia32' ? 'ia32' : 'x64';
  const asset = (rel.assets || []).find((a) => a.name === 'Abli-Code-Setup-' + latest + '-' + arch + '.exe');
  if (!asset) return;
  updAsset = asset;
  setUpd({ phase: 'available', version: latest, error: '' });
}
async function installUpdate() {
  if (!updAsset || upd.phase === 'downloading' || upd.phase === 'installing') return { ok: false };
  setUpd({ phase: 'downloading', error: '' });
  try {
    const file = path.join(app.getPath('temp'), updAsset.name);
    const d = await fetch(updAsset.browser_download_url);
    if (!d.ok) throw new Error('Download failed (' + d.status + ')');
    fs.writeFileSync(file, Buffer.from(await d.arrayBuffer()));
    setUpd({ phase: 'installing' });
    spawnUpd('cmd.exe', ['/c', 'timeout /t 3 >nul & "' + file + '" /S --force-run'], { detached: true, stdio: 'ignore', windowsHide: true, windowsVerbatimArguments: true }).unref();
    setTimeout(() => app.quit(), 600);
    return { ok: true };
  } catch (e) {
    setUpd({ phase: 'available', error: String((e && e.message) || e) });
    return { ok: false };
  }
}

app.whenReady().then(async () => {
  setTimeout(() => { checkForUpdate().catch(() => {}); }, 4000);
  // Watch GitHub for new releases: every 3 minutes, and whenever the window gets focus. ETag makes unchanged checks free.
  setInterval(() => { checkForUpdate().catch(() => {}); }, 3 * 60 * 1000);
  app.on('browser-window-focus', () => { checkForUpdate().catch(() => {}); });
  if (!BACKEND_URL) await startEmbeddedServer();

  handle('window:minimize', () => mainWindow?.minimize());
  handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  handle('window:close', () => mainWindow?.close());
  handle('update:state', () => upd);
  handle('update:install', () => installUpdate());

  handle('dialog:pickFolder', async () => {
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return res.canceled ? null : res.filePaths[0];
  });

  handle('dialog:pickFile', async () => {
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] });
    return res.canceled ? null : res.filePaths[0];
  });

  handle('computer:invoke', async (_ev, { toolName, args }) => {
    if (NEEDS_APPROVAL[toolName] && !(await askApproval(toolName, args))) {
      return { ok: false, exitCode: 1, stdout: '', stderr: 'The user denied this action.' };
    }
    return executeComputerTool(toolName, args || {});
  });

  handle('rea:invoke', async (_ev, { toolName, args }) => {
    return executeReaTool(toolName, args || {});
  });

  handle('shell:openExternal', async (_ev, url) => {
    if (!/^https?:\/\//i.test(String(url))) return { ok: false };
    await shell.openExternal(url);
    return { ok: true };
  });

  registerLocal(handle);

  createWindow();
});

app.on('window-all-closed', () => {
  if (serverInstance) {
    try { serverInstance.close(); } catch {}
  }
  if (process.platform !== 'darwin') app.quit();
});
