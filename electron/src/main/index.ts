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

  // Development modunda
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading dev server URL:', process.env.VITE_DEV_SERVER_URL);
    try {
      await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('Failed to load dev server URL:', error);
      // Fallback to local file if dev server fails
      await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
  } else {
    // Production modunda
    const indexPath = join(__dirname, '../renderer/index.html');
    console.log('Loading production index file:', indexPath);
    await mainWindow.loadFile(indexPath);
  }

  // IPC handler for getDeviceInfo
  ipcMain.handle('get-device-info', () => {
    console.log('IPC: Returning device info');
    return deviceService.getDeviceInfo();
  });

  // Debug için window yüklendiğinde
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded successfully');
  });
}

// Uygulama hazır olduğunda pencereyi oluştur
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

// Hata ayıklama için process events
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});