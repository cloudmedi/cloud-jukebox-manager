const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
require('./services/audioService');

let mainWindow;
let tray = null;
let currentSong = null;

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
      if (tray === null) {
        createTray();
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

function updateTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Cloud Media Player',
      enabled: false
    },
    { 
      label: `Şu an çalıyor:${currentSong ? '\n' + currentSong.name : ''}${currentSong?.artist ? '\n' + currentSong.artist : ''}`,
      enabled: false 
    },
    { type: 'separator' },
    {
      label: 'Duraklat',
      click: function() {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('toggle-playback');
        }
      }
    },
    {
      label: 'Sonraki Parça',
      click: function() {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('next-track');
        }
      }
    },
    { type: 'separator' },
    {
      label: `Uzaktan Kontrol Kodu: ${store.get('deviceInfo')?.token || 'Bağlı değil'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Uygulamayı Göster',
      click: function() {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Çıkış',
      click: function() {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    console.log('Tray icon path:', iconPath);
    
    tray = new Tray(iconPath);
    
    // Tray ayarlarını yap
    tray.setToolTip('Cloud Media Player');
    updateTrayMenu();

    // Tray ikonuna çift tıklandığında uygulamayı göster
    tray.on('double-click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    
    // Tray ikonuna tek tıklandığında uygulamayı göster
    tray.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    
    console.log('Tray created successfully');
  } catch (error) {
    console.error('Error creating tray:', error);
  }
}

// Şarkı değiştiğinde tray menüsünü güncelle
ipcMain.on('song-changed', (event, song) => {
  currentSong = song;
  updateTrayMenu();
});

// Playback durumu değiştiğinde tray menüsünü güncelle
ipcMain.on('playback-status-changed', (event, isPlaying) => {
  if (tray) {
    const menu = tray.getContextMenu();
    const pauseMenuItem = menu.items[3];
    pauseMenuItem.label = isPlaying ? 'Duraklat' : 'Devam Et';
    tray.setContextMenu(menu);
  }
});

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
