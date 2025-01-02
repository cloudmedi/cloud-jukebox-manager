const Store = require('electron-store');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('download-state-manager');

class DownloadStateManager {
  constructor() {
    this.store = new Store();
    this.STORE_KEY = 'downloadStates';
  }

  initializePlaylistDownload(playlist) {
    const downloadState = {
      playlistId: playlist._id,
      playlistName: playlist.name,
      totalSongs: playlist.songs.length,
      downloadedSongs: [],
      pendingSongs: [...playlist.songs],
      failedSongs: [],
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      status: 'initializing',
      currentBatch: 0,
      totalBatches: Math.ceil(playlist.songs.length / 50),
      progress: 0
    };

    this.saveDownloadState(downloadState);
    logger.info(`Initialized download state for playlist: ${playlist.name}`);
    return downloadState;
  }

  getDownloadState(playlistId) {
    const states = this.store.get(this.STORE_KEY, {});
    return states[playlistId];
  }

  saveDownloadState(state) {
    const states = this.store.get(this.STORE_KEY, {});
    states[state.playlistId] = {
      ...state,
      lastUpdateTime: Date.now()
    };
    this.store.set(this.STORE_KEY, states);
    logger.info(`Updated download state for playlist: ${state.playlistName}`);
  }

  updateSongStatus(playlistId, songId, status, error = null) {
    const state = this.getDownloadState(playlistId);
    if (!state) return;

    switch (status) {
      case 'downloaded':
        state.downloadedSongs.push(songId);
        state.pendingSongs = state.pendingSongs.filter(s => s._id !== songId);
        break;
      case 'failed':
        state.failedSongs.push({ songId, error });
        state.pendingSongs = state.pendingSongs.filter(s => s._id !== songId);
        break;
    }

    state.progress = (state.downloadedSongs.length / state.totalSongs) * 100;
    state.status = this.calculateStatus(state);
    
    this.saveDownloadState(state);
    logger.info(`Updated song status: ${songId} -> ${status} in playlist: ${state.playlistName}`);
  }

  calculateStatus(state) {
    if (state.failedSongs.length === state.totalSongs) return 'failed';
    if (state.downloadedSongs.length === state.totalSongs) return 'completed';
    if (state.failedSongs.length > 0) return 'partial';
    return 'downloading';
  }

  resumeDownload(playlistId) {
    const state = this.getDownloadState(playlistId);
    if (!state || state.status === 'completed') return null;

    state.status = 'resuming';
    this.saveDownloadState(state);
    logger.info(`Resuming download for playlist: ${state.playlistName}`);
    return state;
  }

  clearDownloadState(playlistId) {
    const states = this.store.get(this.STORE_KEY, {});
    delete states[playlistId];
    this.store.set(this.STORE_KEY, states);
    logger.info(`Cleared download state for playlist: ${playlistId}`);
  }
}

module.exports = new DownloadStateManager();