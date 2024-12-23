const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
const { generateToken, getDeviceInfo } = require('./services/deviceService');
const { registerToken } = require('./services/apiService');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
require('./services/audioService');

let mainWindow;
let tray = null;

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    console.log('Tray icon path:', iconPath);
    
    tray = new Tray(iconPath);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: function() {
          mainWindow.show();
          mainWindow.focus();
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

    tray.setToolTip('Cloud Media Player');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    
    tray.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    
    console.log('Tray created successfully');
  } catch (error) {
    console.error('Error creating tray:', error);
  }
}

async function initializeDevice() {
  let deviceInfo = store.get('deviceInfo');
  
  if (!deviceInfo || !deviceInfo.token) {
    console.log('No device info found, generating new token...');
    try {
      // Token üret
      const token = generateToken();
      // Cihaz bilgilerini al
      const systemInfo = getDeviceInfo();
      
      // Token'ı backend'e kaydet
      await registerToken(token, systemInfo);
      
      // Local storage'a kaydet
      deviceInfo = {
        token,
        ...systemInfo
      };
      store.set('deviceInfo', deviceInfo);
      
      console.log('New device registered with token:', token);
    } catch (error) {
      console.error('Error initializing device:', error);
    }
  }
  
  return deviceInfo;
}

async function createWindow() {
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

  // İlk başlatmada cihaz bilgilerini kontrol et ve gerekirse token üret
  const deviceInfo = await initializeDevice();
  
  if (deviceInfo && deviceInfo.token) {
    websocketService.connect(deviceInfo.token);
    
    const playlists = store.get('playlists', []);
    if (playlists.length > 0) {
      const lastPlaylist = playlists[playlists.length - 1];
      console.log('Starting last saved playlist:', lastPlaylist.name);
      
      const shouldAutoPlay = playbackStateManager.getPlaybackState();
      console.log('Should auto-play:', shouldAutoPlay);
      
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('auto-play-playlist', {
          playlist: lastPlaylist,
          shouldAutoPlay: shouldAutoPlay
        });
      });
    }
  }
}

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
