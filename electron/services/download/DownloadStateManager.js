const Store = require('electron-store');

class DownloadStateManager {
  constructor() {
    this.store = new Store({
      name: 'download-state',
      defaults: {
        downloads: {},
        chunks: {},
        playlists: {}
      }
    });
  }

  saveDownloadState(playlistId, state) {
    this.store.set(`downloads.${playlistId}`, {
      ...state,
      lastUpdated: new Date().toISOString()
    });
  }

  getDownloadState(playlistId) {
    return this.store.get(`downloads.${playlistId}`);
  }

  clearDownloadState(playlistId) {
    this.store.delete(`downloads.${playlistId}`);
  }

  getIncompleteDownloads() {
    const downloads = this.store.get('downloads');
    return Object.entries(downloads)
      .filter(([_, state]) => state.status === 'downloading')
      .map(([playlistId, state]) => ({
        playlistId,
        ...state
      }));
  }
}

module.exports = new DownloadStateManager();