const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const DeviceService = require('./services/deviceService');
const ApiService = require('./services/apiService');

let mainWindow = null;
const deviceService = DeviceService.getInstance();
const apiService = ApiService.getInstance();

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    },
    autoHideMenuBar: true
  });

  const deviceInfo = deviceService.getDeviceInfo();
  try {
    await apiService.registerToken(deviceInfo);
  } catch (error) {
    console.error('Failed to register token:', error);
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    try {
      await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('Failed to load dev server URL:', error);
      await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  ipcMain.handle('get-device-info', () => {
    return deviceService.getDeviceInfo();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});