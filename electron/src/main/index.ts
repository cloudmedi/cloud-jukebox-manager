import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import DeviceService from '../services/deviceService';
import ApiService from '../services/apiService';

let mainWindow: BrowserWindow | null = null;
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

  // Token ve cihaz bilgilerini kaydet
  const deviceInfo = deviceService.getDeviceInfo();
  try {
    console.log('Registering token with device info:', deviceInfo);
    await apiService.registerToken(deviceInfo);
    console.log('Token registered successfully');
  } catch (error) {
    console.error('Failed to register token:', error);
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // IPC handler for getDeviceInfo
  ipcMain.handle('get-device-info', () => {
    console.log('IPC: Returning device info');
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