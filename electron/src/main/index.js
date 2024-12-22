"use strict";
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DeviceService = require('./services/deviceService');
const ApiService = require('./services/apiService');

let mainWindow;
let deviceService;
let apiService;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  deviceService = new DeviceService();
  apiService = new ApiService();
  
  createWindow();

  ipcMain.handle('get-device-info', () => {
    return deviceService.getDeviceInfo();
  });

  ipcMain.handle('api-request', async (event, { method, endpoint, data }) => {
    return apiService.makeRequest(method, endpoint, data);
  });

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