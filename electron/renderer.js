const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const UIManager = require('./services/ui/UIManager');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');
const { createLogger } = require('./utils/logger');

const logger = createLogger('renderer');

// WebSocket mesaj dinleyicileri
ipcRenderer.on('playlist-received', (event, playlist) => {
  logger.info('New playlist received:', playlist);
  
  const result = PlaylistInitializer.initializePlaylist(playlist);
  if (result) {
    ipcRenderer.invoke('play-playlist', result.playlist);
  }
});

// Playback status updates
ipcRenderer.on('playback-status', (event, status) => {
  UIManager.updatePlaybackBadge(status);
});

// Download progress updates
ipcRenderer.on('download-progress', (event, { songName, progress }) => {
  UIManager.showDownloadProgress(progress, songName);
});

// WebSocket connection status
ipcRenderer.on('websocket-status', (event, isConnected) => {
  UIManager.updateConnectionStatus(isConnected);
});

// Error handling
ipcRenderer.on('error', (event, message) => {
  UIManager.showError(message);
});

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
  const playlists = store.get('playlists', []);
  UIManager.updatePlaybackBadge(playlists.length > 0 ? 'paused' : 'no-playlist');
});