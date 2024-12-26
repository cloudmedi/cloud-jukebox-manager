const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const WebSocketService = require('./services/websocketService');

let mainWindow;
let webSocketService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // WebSocket servisini başlat
  webSocketService = WebSocketService.getInstance();
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

// IPC event handlers
ipcMain.on('send-to-device', (event, message) => {
  if (webSocketService) {
    webSocketService.sendMessage(message);
  }
});

ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

// Cleanup on quit
app.on('before-quit', () => {
  if (webSocketService) {
    webSocketService.cleanup();
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (mainWindow) {
    mainWindow.webContents.send('error', error.message);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (mainWindow) {
    mainWindow.webContents.send('error', reason.message);
  }
});