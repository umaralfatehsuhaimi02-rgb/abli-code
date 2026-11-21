import { app, BrowserWindow, dialog, ipcMain, nativeImage, nativeTheme, session, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAbliServer } from '../server.mjs';
import { executeComputerTool } from '../lib/computer-control.mjs';
import { executeReaTool } from '../mcp/rea-server.mjs';

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
let localPort = Number(process.env.PORT || 4747);
let serverInstance = null;

async function startEmbeddedServer() {
  const srv = createAbliServer();
  return new Promise((resolve) => {
    srv.on('error', () => {
      resolve(null);
    });
    srv.listen(localPort, '127.0.0.1', () => {
      serverInstance = srv;
      resolve(srv);
    });
  });
}

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

  // GitHub, Google, and Supabase sign-in always open in the default browser, never in this window.
  const SIGNIN_HOSTS = [/(^|\.)github\.com$/, /(^|\.)google\.com$/, /\.supabase\.co$/];
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const u = new URL(url);
      if (/^https?:$/.test(u.protocol) && SIGNIN_HOSTS.some((re) => re.test(u.hostname))) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch {}
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      if (/^https?:$/.test(u.protocol) && SIGNIN_HOSTS.some((re) => re.test(u.hostname))) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    } catch {}
    return { action: 'allow' };
  });

  mainWindow.loadURL(`http://127.0.0.1:${localPort}/?desktop=1#/app`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startEmbeddedServer();

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());

  ipcMain.handle('dialog:pickFolder', async () => {
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    return res.canceled ? null : res.filePaths[0];
  });

  ipcMain.handle('dialog:pickFile', async () => {
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] });
    return res.canceled ? null : res.filePaths[0];
  });

  ipcMain.handle('computer:invoke', async (_ev, { toolName, args }) => {
    return executeComputerTool(toolName, args || {});
  });

  ipcMain.handle('rea:invoke', async (_ev, { toolName, args }) => {
    return executeReaTool(toolName, args || {});
  });

  ipcMain.handle('shell:openExternal', async (_ev, url) => {
    if (!/^https?:\/\//i.test(String(url))) return { ok: false };
    await shell.openExternal(url);
    return { ok: true };
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (serverInstance) {
    try { serverInstance.close(); } catch {}
  }
  if (process.platform !== 'darwin') app.quit();
});
