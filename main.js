const { app, BrowserWindow, shell, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// for the system tray icon badge
let mainUnreadCount = 0;
const overlayIcon = nativeImage.createFromPath(
    path.join(__dirname, 'src', 'icons', 'unread-badge.png')
);


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 3000,
        height: 900,
        frame: true, 
        autoHideMenuBar: true,  
        transparent: false,
        webPreferences: {
            preload: path.join(__dirname, 'src/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true, 
        },
    });
    
    mainWindow.loadFile('src/index.html');

    // Handle script loading
    ipcMain.handle('load-script', async (event, filename) => {
        try {
            const scriptPath = path.join(__dirname, 'src', filename);
            const scriptContent = await fs.readFile(scriptPath, 'utf8');
            return scriptContent;
        } catch (error) {
            console.error('Failed to load script:', filename, error);
            throw error;
        }
    });

    // set the unread count and badge for the system tray icon
    ipcMain.on('set-overlay-badge', (event, count) => {
        mainUnreadCount = count;
    });

    // it appears that I need to reset this every second (not sure why, maybe because of Teams overriding?)
    setInterval(() => {
        if (mainWindow){
            if (mainUnreadCount > 0) {
                mainWindow.setOverlayIcon(overlayIcon, '');
            } else {
                mainWindow.setOverlayIcon(null, '');
            }
        }
    }, 1000); // every second
}

app.on('web-contents-created', (event, contents) => {
    
    // Set up handlers for this webContents
    contents.setWindowOpenHandler(({ url }) => {
        const urlObj = new URL(url);
        // Keep Slack links in electron so that I can sign into new workspaces
        if (urlObj.hostname.includes('slack.com') || urlObj.href === 'about:blank') {
            // Allow these to open in new Electron window with controls
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 1200,
                    height: 800,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true
                    }
                }
            };
        } else {
            // Open everything else in system browser
            shell.openExternal(url);
            return { action: 'deny' };
        }
    });
    

});


app.once('ready', () => {
    app.userAgentFallback =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
