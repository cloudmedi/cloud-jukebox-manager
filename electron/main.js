const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
const deviceService = require('./services/deviceService');
const apiService = require('./services/apiService');
require('./services/audioService');

let mainWindow;

async function initializeDevice() {
  try {
    // Token kontrolü
    let token = deviceService.getStoredToken();
    console.log('Checking stored token:', token);
    
    if (!token) {
      console.log('No token found, generating new token...');
      token = await deviceService.generateAndRegisterToken();
      console.log('New token generated and registered:', token);
    }

    // WebSocket bağlantısını başlat
    if (token) {
      console.log('Connecting to WebSocket with token:', token);
      websocketService.connect(token);
    }

    // Ana pencereye token'ı gönder
    if (mainWindow) {
      mainWindow.webContents.send('update-token', token);
    }
  } catch (error) {
    console.error('Error initializing device:', error);
  }
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

  // Son kaydedilen playlist'i kontrol et ve yükle
  const playlists = store.get('playlists', []);
  if (playlists.length > 0) {
    const lastPlaylist = playlists[playlists.length - 1];
    console.log('Starting last saved playlist:', lastPlaylist.name);
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('auto-play-playlist', lastPlaylist);
    });
  }
}

app.whenReady().then(async () => {
  await initializeDevice();
  createWindow();
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

// IPC handlers for token management
ipcMain.handle('get-device-token', async () => {
  return deviceService.getStoredToken();
});

ipcMain.handle('regenerate-token', async () => {
  return await deviceService.generateAndRegisterToken();
});
