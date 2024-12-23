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
    minWidth: 400,
    minHeight: 300,
    maxWidth: 400,
    maxHeight: 300,
    resizable: false,
    backgroundColor: '#1a1b1e',
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile('index.html');
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Pencere kapatıldığında sistem tepsisine küçült
  mainWindow.on('close', function (event) {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Uygulama başladığında son kaydedilen playlist'i kontrol et
  const deviceInfo = store.get('deviceInfo');
  if (deviceInfo && deviceInfo.token) {
    websocketService.connect(deviceInfo.token);
    
    // Son kaydedilen playlist'i kontrol et ve varsa otomatik başlat
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

  // Tray ikonuna çift tıklandığında uygulamayı göster
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

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

app.on('before-quit', () => {
  app.isQuitting = true;
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