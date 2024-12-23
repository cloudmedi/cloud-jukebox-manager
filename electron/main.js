const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
require('./services/audioService');

let mainWindow;
let tray = null;

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

    // Prevent window from closing when X button is clicked
    mainWindow.on('close', function (event) {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

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

function createTray() {
    // Tray ikonu oluştur
    tray = new Tray(path.join(__dirname, 'icon.png'));
    
    // Tray menüsünü oluştur
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: function() {
                mainWindow.show();
            }
        },
        {
            label: 'Close',
            click: function() {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    // Tray ayarlarını yap
    tray.setToolTip('Cloud Media Player');
    tray.setContextMenu(contextMenu);

    // Çift tıklama ile pencereyi göster
    tray.on('double-click', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();
});

// Tüm pencereler kapandığında
app.on('window-all-closed', () => {
    if (!app.isQuitting) {
        return false;
    }
    
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

// Mevcut IPC handlers'ları koru
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