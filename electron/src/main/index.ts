import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { WebSocket } from 'ws';
import * as si from 'systeminformation';

let mainWindow: BrowserWindow | null = null;
let ws: WebSocket | null = null;

function generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getDeviceInfo() {
  const cpu = await si.cpu();
  const os = await si.osInfo();
  const system = await si.system();
  
  return {
    deviceName: system.model || 'Unknown Device',
    osType: os.platform,
    osVersion: os.release,
    cpuModel: cpu.manufacturer + ' ' + cpu.brand,
    token: generateToken()
  };
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    },
    autoHideMenuBar: true
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../../dist/renderer/index.html'));
  }
}

ipcMain.handle('get-device-info', async () => {
  try {
    return await getDeviceInfo();
  } catch (error) {
    console.error('Error getting device info:', error);
    throw error;
  }
});

function initializeWebSocket(deviceInfo: any) {
  try {
    ws = new WebSocket('ws://localhost:5000');

    ws.on('open', () => {
      console.log('WebSocket connection established');
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'device_connect',
          data: deviceInfo
        }));
        
        mainWindow?.webContents.send('connection-status', 'connected');
        mainWindow?.webContents.send('device-token', deviceInfo.token);
      }
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        mainWindow?.webContents.send('ws-message', message);
      } catch (error) {
        console.error('WebSocket message processing error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      mainWindow?.webContents.send('connection-status', 'disconnected');
      setTimeout(() => initializeWebSocket(deviceInfo), 5000);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      mainWindow?.webContents.send('connection-status', 'error');
    });
  } catch (error) {
    console.error('WebSocket initialization error:', error);
    mainWindow?.webContents.send('connection-status', 'error');
    setTimeout(() => initializeWebSocket(deviceInfo), 5000);
  }
}

app.whenReady().then(async () => {
  const deviceInfo = await getDeviceInfo();
  await createWindow();
  initializeWebSocket(deviceInfo);
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