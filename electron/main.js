const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store({ encryptionKey: 'your-secure-key' }); // Veri şifreleme
const websocketService = require('./services/websocketService');
const { setupSecurityHandlers } = require('./security/securityHandlers');
require('./services/audioService');

let mainWindow;
let tray = null;

// CSP ayarları
const CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'wss:', 'https:'],
  'media-src': ["'self'", 'https:']
};

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
      webSecurity: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: ['--disable-site-isolation-trials']
    }
  });

  // CSP uygula
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          Object.entries(CSP)
            .map(([key, value]) => `${key} ${value.join(' ')}`)
            .join('; ')
        ]
      }
    });
  });

  mainWindow.loadFile('index.html');

  // DevTools'u production'da kapat
  if (process.env.NODE_ENV !== 'development') {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  // Tray implementation
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: function() {
        mainWindow.show();
        mainWindow.focus(); // Pencereyi ön plana getir
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
    mainWindow.focus(); // Pencereyi ön plana getir
  });

  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus(); // Pencereyi ön plana getir
  });
}

// Güvenli IPC handlers
setupSecurityHandlers();

// Store encryption için güvenli metodlar
ipcMain.handle('store:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('store:delete', (event, key) => {
  store.delete(key);
});

// App lifecycle events
app.whenReady().then(() => {
  createWindow();
  // Uygulama başladığında tray'i oluştur
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
