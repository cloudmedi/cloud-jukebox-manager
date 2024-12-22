const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
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

// Device bilgilerini kaydetme
ipcMain.on('save-device-info', (event, deviceInfo) => {
  store.set('deviceInfo', deviceInfo);
  event.reply('device-info-saved', deviceInfo);
});

// Device bilgilerini alma
ipcMain.on('get-device-info', (event) => {
  const deviceInfo = store.get('deviceInfo');
  event.reply('device-info', deviceInfo);
});