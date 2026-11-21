const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('abliDesktop', {
  isDesktop: true,
  platform: process.platform,
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  pickFile: () => ipcRenderer.invoke('dialog:pickFile'),
  runComputerTool: (toolName, args) => ipcRenderer.invoke('computer:invoke', { toolName, args }),
  runReaTool: (toolName, args) => ipcRenderer.invoke('rea:invoke', { toolName, args }),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
});
