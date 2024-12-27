const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const encryptionService = require('./services/encryption');
const store = new Store({ 
  encryptionKey: 'your-secure-encryption-key',
  beforeEach: (key, value) => {
    if (key === 'deviceInfo') {
      return encryptionService.encrypt(JSON.stringify(value));
    }
    return value;
  },
  afterEach: (key, value) => {
    if (key === 'deviceInfo' && value) {
      return JSON.parse(encryptionService.decrypt(value));
    }
    return value;
  }
});

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
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // CSP başlığını ayarla
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self';",
          "style-src 'self' 'unsafe-inline';",
          "connect-src 'self' ws://localhost:5000 http://localhost:5000;",
          "img-src 'self' data: https:;"
        ].join(' ')
      }
    });
  });

  mainWindow.loadFile('index.html');
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Güvenli IPC kanallarını kur
  setupSecureIPC();
}

// Güvenli IPC kanallarını kur
function setupSecureIPC() {
  ipcMain.handle('get-device-info', async () => {
    try {
      const deviceInfo = store.get('deviceInfo');
      return deviceInfo ? { token: deviceInfo.token } : null;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  });

  ipcMain.handle('save-device-info', async (event, deviceInfo) => {
    try {
      store.set('deviceInfo', deviceInfo);
      if (deviceInfo?.token) {
        websocketService.connect(deviceInfo.token);
      }
      return true;
    } catch (error) {
      console.error('Error saving device info:', error);
      return false;
    }
  });
}

// Tray oluşturma
function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
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
