import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import DeviceService from './services/deviceService';

let mainWindow: BrowserWindow | null = null;
let deviceService: any = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    },
    autoHideMenuBar: true
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // DeviceService'i app hazır olduktan sonra başlat
  deviceService = DeviceService.getInstance();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers'ı app hazır olduktan sonra kaydet
ipcMain.handle('get-device-info', () => {
  return deviceService.getDeviceInfo();
});