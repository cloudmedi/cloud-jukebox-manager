const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const chunkDownloadManager = require('../download/ChunkDownloadManager');
const downloadStateManager = require('../download/managers/DownloadStateManager');
const audioPlayer = require('../audio/AudioPlayer');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playlist-handler');

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
    this.setupDownloadListeners();
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  setupDownloadListeners() {
    chunkDownloadManager.on('songDownloaded', (songId) => {
      logger.info(`Song ${songId} downloaded successfully`);
    });

    chunkDownloadManager.on('progress', (progress) => {
      logger.debug('Download progress:', progress);
    });
  }

  async handlePlaylist(playlist) {
    try {
      logger.info('Handling playlist:', playlist.name);
      
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // İlk şarkıyı hemen indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        logger.info('Starting download of first song:', firstSong.name);
        const firstSongPath = await chunkDownloadManager.downloadSong(
          firstSong,
          playlist.baseUrl,
          playlistDir
        );

        // İlk şarkı hazır olduğunda oynatıcıya bildir
        if (firstSongPath) {
          logger.info('First song ready:', firstSongPath);
          firstSong.localPath = firstSongPath;
          if (audioPlayer && typeof audioPlayer.handleFirstSongReady === 'function') {
            audioPlayer.handleFirstSongReady(firstSong._id, firstSongPath);
          }
        }
      }

      // Kalan şarkıları kuyruğa ekle
      logger.info('Adding remaining songs to queue');
      for (let i = 1; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        logger.info(`Adding song to queue: ${song.name}`);
        chunkDownloadManager.queueSongDownload(
          song,
          playlist.baseUrl,
          playlistDir
        );
        song.localPath = path.join(playlistDir, `${song._id}.mp3`);
      }

      // Store playlist info
      const updatedPlaylist = {
        ...playlist,
        songs: playlist.songs
      };

      const playlists = store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = updatedPlaylist;
      } else {
        playlists.push(updatedPlaylist);
      }
      
      store.set('playlists', playlists);
      
      return updatedPlaylist;
    } catch (error) {
      logger.error('Error handling playlist:', error);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();