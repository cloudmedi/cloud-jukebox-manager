const { app, BrowserWindow } = require('electron');
const path = require('path');
const { setupDeviceToken } = require('./utils/device');
const { initializeFileSystem } = require('./utils/filesystem');
const { connectWebSocket } = require('./utils/websocket');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true,
    backgroundColor: '#000000'
  });

  // Minimal arayüz yükle
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Cihaz token ve bilgilerini hazırla
  const deviceInfo = await setupDeviceToken();
  console.log('Device Info:', deviceInfo);

  // Dosya sistemini hazırla
  await initializeFileSystem();

  // WebSocket bağlantısını başlat
  connectWebSocket(deviceInfo.token);
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