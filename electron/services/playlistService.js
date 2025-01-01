const { app } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const AsyncDownloadManager = require('./download/AsyncDownloadManager');
const DownloadStateManager = require('./download/DownloadStateManager');
const websocketService = require('./websocketService');

class PlaylistService {
  constructor() {
    this.store = new Store();
    this.initializeDownloadPath();
  }

  initializeDownloadPath() {
    try {
      this.downloadPath = path.join(app.getPath('userData'), 'downloads');
      console.log('Download path:', this.downloadPath);
      this.ensureDirectoryExists(this.downloadPath);
      this.store.set('downloadPath', this.downloadPath);
    } catch (error) {
      console.error('Download path initialization error:', error);
    }
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async handlePlaylistMessage(message, ws) {
    console.log('Playlist message received:', message);
    
    if (!message || !message.data) {
      console.error('Invalid playlist message:', message);
      websocketService.updatePlaylistStatus('error', message.data?._id);
      return;
    }
    
    const playlist = message.data;
    
    try {
      console.log('Starting playlist download:', playlist.name);
      websocketService.updatePlaylistStatus('downloading', playlist._id);
      
      // Asenkron indirme başlat
      await AsyncDownloadManager.handlePlaylistDownload(playlist);
      
      // İlk şarkı indirildiğinde playlist'i hazır olarak işaretle
      websocketService.updatePlaylistStatus('ready', playlist._id);
      
      return true;
    } catch (error) {
      console.error('Playlist handling error:', error);
      websocketService.updatePlaylistStatus('error', playlist._id);
      throw error;
    }
  }
}

module.exports = new PlaylistService();