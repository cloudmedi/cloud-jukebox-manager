const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
require('./services/audioService');

let mainWindow;
let tray = null;

function createTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ses Kontrolü',
      submenu: [
        {
          label: 'Sesi Artır',
          click: () => {
            mainWindow.webContents.send('set-volume', Math.min((store.get('volume', 70) || 70) + 10, 100));
          }
        },
        {
          label: 'Sesi Azalt',
          click: () => {
            mainWindow.webContents.send('set-volume', Math.max((store.get('volume', 70) || 70) - 10, 0));
          }
        },
        { type: 'separator' },
        {
          label: 'Sessiz',
          type: 'checkbox',
          checked: store.get('muted', false),
          click: (menuItem) => {
            mainWindow.webContents.send('toggle-mute', menuItem.checked);
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Medya Kontrolleri',
      submenu: [
        {
          label: 'Önceki',
          click: () => {
            mainWindow.webContents.send('media-control', 'previous');
          }
        },
        {
          label: 'Oynat/Duraklat',
          click: () => {
            mainWindow.webContents.send('media-control', 'play-pause');
          }
        },
        {
          label: 'Sonraki',
          click: () => {
            mainWindow.webContents.send('media-control', 'next');
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Göster',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Çıkış',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

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

  // X tuşuna basıldığında sistem tepsisine küçült
  mainWindow.on('close', function (event) {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Tray yoksa oluştur
      if (!tray) {
        const iconPath = path.join(__dirname, 'icon.png');
        tray = new Tray(iconPath);
        tray.setToolTip('Cloud Media Player');
        
        // Tray ikonuna çift tıklandığında pencereyi göster
        tray.on('double-click', () => {
          mainWindow.show();
          mainWindow.focus();
        });
        
        createTrayMenu();
      }
    }
    return false;
  });

  // Uygulama başladığında son kaydedilen playlist'i kontrol et
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

// Uygulama kapanmadan önce isQuitting'i true yap
app.on('before-quit', () => {
  app.isQuitting = true;
});

// IPC handlers
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

// Ses seviyesi değişikliklerini store'a kaydet
ipcMain.on('volume-changed', (event, volume) => {
  store.set('volume', volume);
});

// Sessiz durumunu store'a kaydet
ipcMain.on('mute-changed', (event, muted) => {
  store.set('muted', muted);
});