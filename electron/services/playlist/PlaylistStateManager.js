const Store = require('electron-store');
const { createLogger } = require('../../utils/logger');
const { EventEmitter } = require('events');

const logger = createLogger('playlist-state-manager');

class PlaylistStateManager extends EventEmitter {
  constructor() {
    super();
    this.store = new Store({
      name: 'playlist-states',
      defaults: {
        playlists: {},
        downloads: {},
        activePlaylist: null
      }
    });
  }

  updatePlaylistState(playlistId, updates) {
    const currentState = this.store.get(`playlists.${playlistId}`, {});
    const newState = { ...currentState, ...updates, lastUpdated: Date.now() };
    
    this.store.set(`playlists.${playlistId}`, newState);
    this.emit('playlistStateChanged', { playlistId, state: newState });
    
    logger.info(`Updated playlist state: ${playlistId}`, updates);
  }

  updateDownloadProgress(playlistId, songId, progress) {
    const downloadKey = `downloads.${playlistId}.${songId}`;
    const currentProgress = this.store.get(downloadKey, {});
    
    const newProgress = {
      ...currentProgress,
      ...progress,
      lastUpdated: Date.now()
    };
    
    this.store.set(downloadKey, newProgress);
    this.emit('downloadProgressUpdated', { playlistId, songId, progress: newProgress });
  }

  getPlaylistState(playlistId) {
    return this.store.get(`playlists.${playlistId}`);
  }

  getDownloadProgress(playlistId, songId) {
    return this.store.get(`downloads.${playlistId}.${songId}`);
  }

  setActivePlaylist(playlistId) {
    this.store.set('activePlaylist', playlistId);
    this.emit('activePlaylistChanged', playlistId);
  }

  getActivePlaylist() {
    return this.store.get('activePlaylist');
  }

  clearPlaylistState(playlistId) {
    this.store.delete(`playlists.${playlistId}`);
    this.store.delete(`downloads.${playlistId}`);
    
    if (this.getActivePlaylist() === playlistId) {
      this.store.delete('activePlaylist');
    }
    
    this.emit('playlistStateCleared', playlistId);
    logger.info(`Cleared playlist state: ${playlistId}`);
  }
}

module.exports = new PlaylistStateManager();