const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendMessageToMain: (data) => {
        try {
            // ipcRenderer.sendToHost('debug-log', ...data); 
            ipcRenderer.sendToHost(...data);
        } catch (err) {
            ipcRenderer.sendToHost('debug-log', 'error!');        
        }
    }
});

