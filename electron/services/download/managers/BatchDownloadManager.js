const { createLogger } = require('../../../utils/logger');
const downloadStateManager = require('./DownloadStateManager');
const chunkDownloadManager = require('../ChunkDownloadManager');
const { EventEmitter } = require('events');

const logger = createLogger('batch-download-manager');

class BatchDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.BATCH_SIZE = 50;
    this.activeDownloads = new Map();
  }

  async startBatchDownload(playlist, baseUrl, playlistDir) {
    try {
      let state = downloadStateManager.getDownloadState(playlist._id);
      
      if (!state) {
        state = downloadStateManager.initializePlaylistDownload(playlist);
      } else {
        state = downloadStateManager.resumeDownload(playlist._id);
      }

      if (!state || state.status === 'completed') {
        logger.info(`No download needed for playlist: ${playlist.name}`);
        return;
      }

      logger.info(`Starting batch download for playlist: ${playlist.name}`);
      
      const pendingSongs = state.pendingSongs;
      const totalBatches = Math.ceil(pendingSongs.length / this.BATCH_SIZE);

      for (let i = 0; i < totalBatches; i++) {
        const batchStart = i * this.BATCH_SIZE;
        const batchSongs = pendingSongs.slice(batchStart, batchStart + this.BATCH_SIZE);
        
        logger.info(`Processing batch ${i + 1}/${totalBatches} for playlist: ${playlist.name}`);
        
        await this.processBatch(batchSongs, baseUrl, playlistDir, playlist._id);
        
        state.currentBatch = i + 1;
        downloadStateManager.saveDownloadState(state);
      }

      logger.info(`Completed all batches for playlist: ${playlist.name}`);
    } catch (error) {
      logger.error(`Error in batch download: ${error.message}`, error);
      throw error;
    }
  }

  async processBatch(songs, baseUrl, playlistDir, playlistId) {
    const downloads = songs.map(song => 
      this.downloadSong(song, baseUrl, playlistDir, playlistId)
    );

    await Promise.allSettled(downloads);
  }

  async downloadSong(song, baseUrl, playlistDir, playlistId) {
    try {
      const result = await chunkDownloadManager.downloadSong(song, baseUrl, playlistDir);
      downloadStateManager.updateSongStatus(playlistId, song._id, 'downloaded');
      return result;
    } catch (error) {
      logger.error(`Failed to download song: ${song.name}`, error);
      downloadStateManager.updateSongStatus(playlistId, song._id, 'failed', error.message);
      throw error;
    }
  }

  getDownloadProgress(playlistId) {
    return downloadStateManager.getDownloadState(playlistId);
  }
}

module.exports = new BatchDownloadManager();