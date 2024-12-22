const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const DeviceService = require('../services/deviceService');
const ApiService = require('../services/apiService');

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
    console.log('Registering token with device info:', deviceInfo);
    await apiService.registerToken(deviceInfo);
    console.log('Token registered successfully');
  } catch (error) {
    console.error('Failed to register token:', error);
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server URL:', process.env.VITE_DEV_SERVER_URL);
    try {
      await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('Failed to load dev server URL:', error);
      await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
  } else {
    const indexPath = join(__dirname, '../renderer/index.html');
    console.log('Loading production index file:', indexPath);
    await mainWindow.loadFile(indexPath);
  }

  ipcMain.handle('get-device-info', () => {
    console.log('IPC: Returning device info');
    return deviceService.getDeviceInfo();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();
});

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

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});