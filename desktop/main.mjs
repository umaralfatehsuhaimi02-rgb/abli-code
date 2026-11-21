import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAbliServer } from '../server.mjs';
import { executeComputerTool } from '../lib/computer-control.mjs';
import { executeReaTool } from '../mcp/rea-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow = null;
let localPort = Number(process.env.PORT || 4747);
let serverInstance = null;

async function startEmbeddedServer() {
  const srv = createAbliServer();
  return new Promise((resolve) => {
    srv.on('error', () => {
      // Port already running (e.g. standalone `npm start`) — reuse existing server
      resolve(null);
    });
    srv.listen(localPort, '127.0.0.1', () => {
      serverInstance = srv;
      resolve(srv);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#050505',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
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
