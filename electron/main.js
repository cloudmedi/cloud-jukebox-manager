const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
const TrayService = require('./services/tray/TrayService');
require('./services/audioService');

let mainWindow;
let trayService;

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
      if (!trayService) {
        trayService = new TrayService(mainWindow);
        trayService.createTray();
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

app.whenReady().then(() => {
  createWindow();
  trayService = new TrayService(mainWindow);
  trayService.createTray();
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

// IPC Event Handlers
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

// Anons durumu güncellemeleri
ipcMain.on('announcement-started', (event, duration) => {
  if (trayService) {
    trayService.setAnnouncementState(true, duration);
  }
});

ipcMain.on('announcement-ended', () => {
  if (trayService) {
    trayService.setAnnouncementState(false);
  }
});

ipcMain.on('announcement-time-update', (event, remainingTime) => {
  if (trayService) {
    trayService.setAnnouncementState(true, remainingTime);
  }
});

// Şarkı ve playback durumu güncellemeleri
ipcMain.on('song-changed', (event, song) => {
  if (trayService) {
    trayService.updateCurrentSong(song);
  }
});

ipcMain.on('playback-status-changed', (event, playing) => {
  if (trayService) {
    trayService.updatePlaybackState(playing);
  }
});