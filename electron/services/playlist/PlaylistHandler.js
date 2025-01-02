const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const chunkDownloadManager = require('../download/ChunkDownloadManager');
const audioPlayer = require('../audio/AudioPlayer');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playlist-handler');
const store = new Store();

class PlaylistHandler {
  constructor() {
    this.setupDownloadListeners();
  }

  setupDownloadListeners() {
    chunkDownloadManager.on('songDownloaded', ({ song, path }) => {
      logger.info(`Song downloaded successfully: ${song.name} at ${path}`);
      song.localPath = path;
      
      // İlk şarkı hazır olduğunda oynatıcıya bildir
      if (audioPlayer && typeof audioPlayer.handleFirstSongReady === 'function') {
        audioPlayer.handleFirstSongReady(song._id, path);
      }
    });

    chunkDownloadManager.on('downloadProgress', ({ song, downloaded, total }) => {
      const progress = Math.round((downloaded / total) * 100);
      logger.info(`Download progress for ${song.name}: ${progress}%`);
    });

    chunkDownloadManager.on('downloadError', ({ song, error }) => {
      logger.error(`Error downloading song ${song.name}:`, error);
    });
  }

  async handlePlaylist(playlist) {
    try {
      logger.info('Handling playlist:', playlist.name);
      
      const playlistDir = path.join(app.getPath('userData'), 'downloads', playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // İlk şarkıyı hemen indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        logger.info('Starting download of first song:', firstSong.name);
        const firstSongPath = await chunkDownloadManager.downloadSong(
          firstSong,
          playlist.baseUrl,
          playlist._id
        );

        // İlk şarkı hazır olduğunda oynatıcıya bildir
        if (firstSongPath) {
          logger.info('First song ready:', firstSongPath);
          firstSong.localPath = firstSongPath;
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
          playlist._id
        );
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

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = new PlaylistHandler();