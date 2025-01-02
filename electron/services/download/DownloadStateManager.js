const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('download-state-manager');

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

  initializeDownload(playlist) {
    const downloadState = {
      id: playlist._id,
      status: 'initializing',
      songs: playlist.songs.map(song => ({
        id: song._id,
        name: song.name,
        status: 'pending',
        downloadedChunks: [],
        totalChunks: 0,
        tempPath: path.join(this.getTempDir(), `${song._id}.temp`),
        error: null
      })),
      startedAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.store.set(`downloads.${playlist._id}`, downloadState);
    logger.info(`Initialized download state for playlist: ${playlist._id}`);
    return downloadState;
  }

  updateSongProgress(playlistId, songId, progress) {
    const downloadPath = `downloads.${playlistId}.songs`;
    const songs = this.store.get(downloadPath, []);
    const updatedSongs = songs.map(song => 
      song.id === songId 
        ? { ...song, ...progress, lastUpdated: Date.now() }
        : song
    );
    
    this.store.set(downloadPath, updatedSongs);
    logger.debug(`Updated progress for song ${songId} in playlist ${playlistId}`);
  }

  getTempDir() {
    const tempDir = path.join(require('electron').app.getPath('userData'), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  }

  getIncompleteDownloads() {
    const downloads = this.store.get('downloads', {});
    return Object.values(downloads).filter(download => 
      download.status !== 'completed' && download.status !== 'failed'
    );
  }

  getSongState(songId) {
    return this.store.get(`chunks.${songId}`, {
      downloadedChunks: [],
      tempPath: null,
      status: 'pending'
    });
  }

  cleanupTempFiles() {
    const tempDir = this.getTempDir();
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach(file => {
        const filePath = path.join(tempDir, file);
        try {
          fs.unlinkSync(filePath);
          logger.info(`Cleaned up temp file: ${filePath}`);
        } catch (error) {
          logger.error(`Error cleaning up temp file: ${filePath}`, error);
        }
      });
    }
  }
}

module.exports = new DownloadStateManager();