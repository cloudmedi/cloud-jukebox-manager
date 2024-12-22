const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Development ortamında DevTools'u aç
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Kayıtlı cihaz bilgilerini al ve WebSocket bağlantısını başlat
  const deviceInfo = store.get('deviceInfo');
  if (deviceInfo && deviceInfo.token) {
    websocketService.connect(deviceInfo.token);
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

// Device bilgilerini kaydetme
ipcMain.handle('save-device-info', async (event, deviceInfo) => {
  store.set('deviceInfo', deviceInfo);
  
  // WebSocket bağlantısını başlat
  if (deviceInfo.token) {
    websocketService.connect(deviceInfo.token);
  }
  
  return deviceInfo;
});

// Device bilgilerini alma
ipcMain.handle('get-device-info', async () => {
  return store.get('deviceInfo');
});