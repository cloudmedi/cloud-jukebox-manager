const Store = require('electron-store');
const { createLogger } = require('../../utils/logger');
const ChunkDownloadManager = require('./ChunkDownloadManager');
const websocketService = require('../websocketService');

const logger = createLogger('download-manager');
const store = new Store();

class DownloadManager {
  constructor() {
    this.chunkManager = new ChunkDownloadManager();
    this.setupWebSocketHandlers();
    this.currentDownload = null;
    this.store = store;
  }

  setupWebSocketHandlers() {
    websocketService.addMessageHandler('resumeDownload', async (message) => {
      logger.info('Received resume download command:', message);
      await this.resumeDownload(message.downloadStatus);
    });
  }

  async startDownload(playlist, baseUrl) {
    try {
      // Initialize download state
      this.currentDownload = {
        playlistId: playlist._id,
        songs: playlist.songs.map(song => ({
          songId: song._id,
          status: 'pending',
          chunks: [],
          progress: 0
        })),
        totalProgress: 0,
        startedAt: new Date()
      };

      // Save initial state
      this.saveDownloadState();

      // Start downloading songs
      for (const song of playlist.songs) {
        await this.downloadSong(song, baseUrl);
      }

      logger.info('Download completed successfully');
      this.clearDownloadState();
    } catch (error) {
      logger.error('Download error:', error);
      this.handleDownloadError(error);
    }
  }

  async resumeDownload(downloadStatus) {
    try {
      logger.info('Resuming download from saved state');

      // Restore download state
      this.currentDownload = downloadStatus;
      
      // Find the first incomplete song
      const incompleteSong = downloadStatus.songs.find(s => 
        s.status !== 'completed' && s.status !== 'error'
      );

      if (incompleteSong) {
        // Resume from the last incomplete chunk
        const lastChunk = incompleteSong.chunks.findIndex(c => 
          c.status !== 'completed'
        );

        await this.chunkManager.resumeDownload(
          incompleteSong,
          lastChunk,
          this.updateProgress.bind(this)
        );
      }

      logger.info('Download resumed successfully');
    } catch (error) {
      logger.error('Resume download error:', error);
      this.handleDownloadError(error);
    }
  }

  async downloadSong(song, baseUrl) {
    try {
      const songDownload = this.currentDownload.songs.find(s => 
        s.songId === song._id
      );

      songDownload.status = 'downloading';
      this.saveDownloadState();

      await this.chunkManager.downloadSong(
        song,
        baseUrl,
        this.updateProgress.bind(this)
      );

      songDownload.status = 'completed';
      songDownload.progress = 100;
      this.saveDownloadState();
    } catch (error) {
      logger.error(`Error downloading song ${song._id}:`, error);
      throw error;
    }
  }

  updateProgress(progress) {
    if (!this.currentDownload) return;

    // Update progress and broadcast to backend
    this.currentDownload.totalProgress = progress;
    this.saveDownloadState();

    websocketService.sendMessage({
      type: 'downloadProgress',
      progress: progress,
      downloadStatus: this.currentDownload
    });
  }

  saveDownloadState() {
    if (this.currentDownload) {
      this.store.set('downloadState', this.currentDownload);
    }
  }

  loadDownloadState() {
    return this.store.get('downloadState');
  }

  clearDownloadState() {
    this.store.delete('downloadState');
    this.currentDownload = null;
  }

  handleDownloadError(error) {
    if (this.currentDownload) {
      this.currentDownload.error = error.message;
      this.saveDownloadState();
    }

    websocketService.sendMessage({
      type: 'downloadError',
      error: error.message,
      downloadStatus: this.currentDownload
    });
  }
}

module.exports = new DownloadManager();