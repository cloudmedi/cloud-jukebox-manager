const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
require('./services/audioService');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        resizable: false,
        backgroundColor: '#1a1b1e',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    mainWindow.loadFile('index.html');
    
    // Remove menu bar
    mainWindow.setMenuBarVisibility(false);

    const deviceInfo = store.get('deviceInfo');
    if (deviceInfo && deviceInfo.token) {
        websocketService.connect(deviceInfo.token);
        
        const playlists = store.get('playlists', []);
        if (playlists.length > 0) {
            const lastPlaylist = playlists[playlists.length - 1];
            console.log('Starting last saved playlist:', lastPlaylist.name);
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('auto-play-playlist', lastPlaylist);
            });
        }
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    websocketService.disconnect();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('save-device-info', async (event, deviceInfo) => {
    store.set('deviceInfo', deviceInfo);
    
    if (deviceInfo.token) {
        websocketService.connect(deviceInfo.token);
    }
    
    return deviceInfo;
});

ipcMain.handle('get-device-info', async () => {
    return store.get('deviceInfo');
});
