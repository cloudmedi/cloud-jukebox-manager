const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
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

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    console.log('Tray icon path:', iconPath);
    
    tray = new Tray(iconPath);
    
    // Şu an çalan şarkı bilgisini al
    const currentSong = store.get('currentSong', { name: '', artist: '' });
    
    // Tray menüsünü oluştur
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Şu an çalıyor:',
        enabled: false,
        icon: path.join(__dirname, 'icon.png')
      },
      {
        label: currentSong.name || 'Şarkı çalmıyor',
        enabled: false,
        icon: path.join(__dirname, 'icons', 'music.png')
      },
      {
        label: currentSong.artist || '',
        enabled: false,
        icon: path.join(__dirname, 'icons', 'user.png')
      },
      { type: 'separator' },
      {
        label: 'Duraklat/Devam Et',
        click: function() {
          mainWindow.webContents.send('toggle-playback');
        },
        icon: path.join(__dirname, 'icons', 'play-pause.png')
      },
      {
        label: 'Sonraki Şarkı',
        click: function() {
          mainWindow.webContents.send('next-track');
        },
        icon: path.join(__dirname, 'icons', 'skip-forward.png')
      },
      { type: 'separator' },
      {
        label: 'Uzaktan Kontrol Kodu:',
        enabled: false,
        icon: path.join(__dirname, 'icons', 'key.png')
      },
      {
        label: store.get('deviceInfo.token', 'Kod bulunamadı'),
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Uygulamayı Göster',
        click: function() {
          mainWindow.show();
          mainWindow.focus();
        },
        icon: path.join(__dirname, 'icons', 'maximize.png')
      },
      {
        label: 'Uygulamadan Çık',
        click: function() {
          app.isQuitting = true;
          app.quit();
        },
        icon: path.join(__dirname, 'icons', 'x.png')
      }
    ]);

    // Tray ayarlarını yap
    tray.setToolTip('Cloud Media Player');
    tray.setContextMenu(contextMenu);

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
  store.set('currentSong', song);
  if (tray) {
    createTray(); // Menüyü yeniden oluştur
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray(); // Uygulama başladığında tray'i oluştur
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
