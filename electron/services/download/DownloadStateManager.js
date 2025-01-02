const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

class DownloadStateManager {
  constructor() {
    this.store = new Store();
  }

  saveDownloadState(playlistId, downloadedSongs, totalSongs) {
    this.store.set(`download.${playlistId}`, {
      downloadedSongs,
      totalSongs,
      timestamp: Date.now()
    });
  }

  getDownloadState(playlistId) {
    return this.store.get(`download.${playlistId}`);
  }

  clearDownloadState(playlistId) {
    this.store.delete(`download.${playlistId}`);
  }

  isDownloadComplete(playlistId) {
    const state = this.getDownloadState(playlistId);
    return state && state.downloadedSongs === state.totalSongs;
  }

  shouldResumeDownload(playlistId) {
    const state = this.getDownloadState(playlistId);
    return state && state.downloadedSongs < state.totalSongs;
  }
}

module.exports = new DownloadStateManager();