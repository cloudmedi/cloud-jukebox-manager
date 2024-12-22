import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  onConnectionStatus: (callback: (status: string) => void) => {
    ipcRenderer.on('connection-status', (_event, status) => callback(status));
    return () => {
      ipcRenderer.removeListener('connection-status', (_event, status) => callback(status));
    };
  },
  onDeviceToken: (callback: (token: string) => void) => {
    ipcRenderer.on('device-token', (_event, token) => callback(token));
    return () => {
      ipcRenderer.removeListener('device-token', (_event, token) => callback(token));
    };
  },
  onWebSocketMessage: (callback: (message: any) => void) => {
    ipcRenderer.on('ws-message', (_event, message) => callback(message));
    return () => {
      ipcRenderer.removeListener('ws-message', (_event, message) => callback(message));
    };
  }
});