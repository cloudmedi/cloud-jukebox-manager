import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  onConnectionStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('connection-status', (_, status) => callback(status));
  },
  onDeviceToken: (callback: (token: string) => void) => {
    ipcRenderer.on('device-token', (_, token) => callback(token));
  },
  onWebSocketMessage: (callback: (message: any) => void) => {
    ipcRenderer.on('ws-message', (_, message) => callback(message));
  }
});