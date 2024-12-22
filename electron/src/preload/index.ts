import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: Function) => {
    ipcRenderer.on(channel, (...args) => func(...args));
  },
  invoke: (channel: string, data: any) => {
    return ipcRenderer.invoke(channel, data);
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  // Cihaz bilgileri için özel metodlar
  getDeviceInfo: () => {
    return new Promise((resolve) => {
      ipcRenderer.once('device-info', (_, info) => resolve(info));
      ipcRenderer.send('get-device-info');
    });
  }
});

// TypeScript için global tip tanımlaması
declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: Function) => void;
      invoke: (channel: string, data: any) => Promise<any>;
      removeAllListeners: (channel: string) => void;
      getDeviceInfo: () => Promise<any>;
    };
  }
}