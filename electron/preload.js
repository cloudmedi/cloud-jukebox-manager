const { contextBridge, ipcRenderer } = require('electron');

// Güvenli API tanımlaması
contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  saveDeviceInfo: (deviceInfo) => ipcRenderer.invoke('save-device-info', deviceInfo),
  onDeviceStatus: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('device-status', subscription);
    return () => {
      ipcRenderer.removeListener('device-status', subscription);
    };
  }
});

// Güvenli konsol loglama
contextBridge.exposeInMainWorld('secureConsole', {
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => console.warn(...args)
});