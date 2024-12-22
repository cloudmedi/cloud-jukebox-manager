import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Add any methods you want to expose to the renderer here
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
  }
});

// For TypeScript support
declare global {
  interface Window {
    api: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: Function) => void;
      invoke: (channel: string, data: any) => Promise<any>;
      removeAllListeners: (channel: string) => void;
    };
  }
}