import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: Function) => {
    ipcRenderer.on(channel, (...args) => func(...args));
  },
  getDeviceInfo: () => {
    console.log('Preload: Requesting device info');
    return ipcRenderer.invoke('get-device-info');
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: Function) => void;
      getDeviceInfo: () => Promise<any>;
      removeAllListeners: (channel: string) => void;
    };
  }
}