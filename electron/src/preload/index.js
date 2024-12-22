const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (...args) => func(...args));
  },
  getDeviceInfo: () => {
    console.log('Preload: Requesting device info');
    return ipcRenderer.invoke('get-device-info');
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});