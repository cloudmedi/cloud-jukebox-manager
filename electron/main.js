const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
require('./services/audioService');

let mainWindow;
let tray = null;
let isPlaying = false;
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

// Update tray menu
function updateTrayMenu(song = currentSong) {
  if (!tray) return;

  const deviceInfo = store.get('deviceInfo');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Cloud Media Player',
      click: function() {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Şu an çalıyor:',
      enabled: false,
      id: 'now-playing-label'
    },
    {
      label: song?.name || 'Şarkı çalmıyor',
      enabled: false,
      id: 'song-name'
    },
    {
      label: song?.artist || '',
      enabled: false,
      id: 'artist-name'
    },
    { type: 'separator' },
    {
      label: isPlaying ? 'Duraklat' : 'Çal',
      click: function() {
        mainWindow.webContents.send('toggle-playback');
      }
    },
    {
      label: 'Sonraki Şarkı',
      click: function() {
        mainWindow.webContents.send('next-song');
      }
    },
    { type: 'separator' },
    {
      label: `Token: ${deviceInfo?.token || 'Yok'}`,
      enabled: false
    },
    { type: 'separator' },
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
    
    updateTrayMenu();
    
    tray.setToolTip('Cloud Media Player');
    
    tray.on('double-click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    
    tray.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    tray.on('right-click', (event, bounds) => {
      const { x, y } = bounds;
      const contextMenu = tray.getContextMenu();
      contextMenu.popup({ x: x - 100, y: y });
    });
    
    console.log('Tray created successfully');
  } catch (error) {
    console.error('Error creating tray:', error);
  }
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

// Playlist durumunu sorgulama - artık asenkron
ipcMain.handle('get-current-playlist', async (event) => {
  const audioService = require('./services/audioService');
  const currentSong = audioService.getCurrentSong();
  console.log('Sending current song info:', currentSong);
  
  return {
    currentSong: currentSong,
    currentIndex: audioService.currentIndex,
    isPlaying: audioService.isPlaying
  };
});

// Şarkı değiştiğinde tray menüsünü güncelle
ipcMain.on('song-changed', (event, song) => {
  console.log('Updating tray menu with song:', song);
  currentSong = song;
  updateTrayMenu(song);
});

// Update playback state when it changes
ipcMain.on('playback-status-changed', (event, playing) => {
  console.log('Playback status changed:', playing);
  isPlaying = playing;
  updateTrayMenu(currentSong);
});
