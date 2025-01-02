const path = require('path');
const fs = require('fs');
const chunkDownloadManager = require('../download/managers/ChunkDownloadManager');
const downloadProgressService = require('../download/DownloadProgressService');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playlist-handler');

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(process.env.APPDATA || process.env.HOME, 'cloud-media-player', 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async handlePlaylist(playlist) {
    try {
      logger.info('Handling playlist:', playlist.name);
      
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // İndirme durumunu başlat
      downloadProgressService.initializeDownload(
        playlist.deviceToken,
        playlist._id,
        playlist.songs.length
      );

      let downloadedSongs = 0;
      for (const song of playlist.songs) {
        song.playlistId = playlist._id;
        try {
          await chunkDownloadManager.downloadSong(song, playlist.baseUrl, playlistDir);
          downloadedSongs++;
          downloadProgressService.updateDownloadedSongs(playlist._id, downloadedSongs);
        } catch (error) {
          logger.error(`Error downloading song ${song.name}:`, error);
          throw error;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error handling playlist:', error);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();