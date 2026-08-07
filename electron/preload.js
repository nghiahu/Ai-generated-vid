const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose safe Electron APIs to the renderer (React frontend).
 * Never expose full Node.js or ipcRenderer directly.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Config management
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (data) => ipcRenderer.invoke('save-config', data),

  // Window management
  openSettings: () => ipcRenderer.invoke('open-settings'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Open external URLs in system browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Check if running in Electron
  isElectron: true
});
