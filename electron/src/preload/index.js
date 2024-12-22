const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  makeRequest: (method, endpoint, data) => 
    ipcRenderer.invoke('api-request', { method, endpoint, data })
});