// will populate later if necessary
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    loadScript: (filename) => ipcRenderer.invoke('load-script', filename),
    setOverlayBadge: (count) => ipcRenderer.send('set-overlay-badge', count)
});
