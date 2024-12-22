import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import DeviceService from '../services/deviceService';
import WebSocketService from '../services/websocketService';

let mainWindow: BrowserWindow | null = null;
const deviceService = DeviceService.getInstance();
const wsService = WebSocketService.getInstance();

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

  // WebSocket bağlantısını başlat
  wsService.connect('ws://localhost:5000');

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Cihaz bilgilerini renderer process'e gönder
  mainWindow.webContents.on('did-finish-load', () => {
    const deviceInfo = deviceService.getDeviceInfo();
    mainWindow?.webContents.send('device-info', deviceInfo);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  wsService.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});