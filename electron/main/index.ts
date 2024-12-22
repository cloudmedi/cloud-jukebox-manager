import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { WebSocket } from 'ws';
import * as si from 'systeminformation';

let mainWindow: BrowserWindow | null = null;
let ws: WebSocket | null = null;

// 6 haneli token oluşturma fonksiyonu
function generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Cihaz bilgilerini toplama fonksiyonu
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
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    },
    autoHideMenuBar: true
  });

  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 5173;
    await mainWindow.loadURL(`http://localhost:${port}`);
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// IPC handlers
ipcMain.handle('get-device-info', async () => {
  try {
    const deviceInfo = await getDeviceInfo();
    return deviceInfo;
  } catch (error) {
    console.error('Error getting device info:', error);
    throw error;
  }
});

function initializeWebSocket(deviceInfo: any) {
  ws = new WebSocket('ws://localhost:5000');

  ws.on('open', () => {
    console.log('WebSocket bağlantısı kuruldu');
    if (ws) {
      ws.send(JSON.stringify({
        type: 'device_connect',
        data: deviceInfo
      }));
    }
    
    mainWindow?.webContents.send('connection-status', 'connected');
    mainWindow?.webContents.send('device-token', deviceInfo.token);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      mainWindow?.webContents.send('ws-message', message);
    } catch (error) {
      console.error('WebSocket mesaj işleme hatası:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket bağlantısı kapandı');
    mainWindow?.webContents.send('connection-status', 'disconnected');
    // 5 saniye sonra yeniden bağlanmayı dene
    setTimeout(() => initializeWebSocket(deviceInfo), 5000);
  });

  ws.on('error', (error) => {
    console.error('WebSocket hatası:', error);
    mainWindow?.webContents.send('connection-status', 'error');
  });
}

app.whenReady().then(async () => {
  await createWindow();
  const deviceInfo = await getDeviceInfo();
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