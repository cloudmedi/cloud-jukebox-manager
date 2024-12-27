const { contextBridge, ipcRenderer } = require('electron');
const { createHash } = require('crypto');

// Güvenli IPC kanalları
const validChannels = [
  'play-announcement',
  'pause-playback',
  'resume-playback',
  'websocket-status',
  'download-progress',
  'error',
  'set-volume',
  'restart-playback',
  'toggle-playback',
  'auto-play-playlist',
  'playlist-received',
  'device-deleted',
  'songRemoved',
  'update-player',
  'show-toast'
];

// Güvenli API'ları expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // IPC iletişimi
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
    
    // Token yönetimi için güvenli metodlar
    token: {
        get: () => ipcRenderer.invoke('token:get'),
        register: () => ipcRenderer.invoke('token:register')
    },
    
  // Store işlemleri için güvenli metodlar
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key)
  },
  // Dosya işlemleri için güvenli metodlar
  file: {
    read: (path) => ipcRenderer.invoke('file:read', path),
    write: (path, data) => ipcRenderer.invoke('file:write', path, data),
    delete: (path) => ipcRenderer.invoke('file:delete', path)
  },
  // Güvenli hash fonksiyonu
  hash: (data) => createHash('sha256').update(data).digest('hex')
});
