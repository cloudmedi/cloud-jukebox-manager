const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const { downloadQueueManager } = require('../download/managers/DownloadQueueManager');
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
    downloadQueueManager.on('songCompleted', (song) => {
      logger.info(`Song ${song._id} downloaded successfully`);
      
      if (this.isFirstSong(song._id)) {
        audioPlayer.handleFirstSongReady(song._id, song.localPath);
      }
    });

    downloadQueueManager.on('songError', ({ song, error }) => {
      logger.error(`Error downloading song ${song._id}:`, error);
    });
  }

  isFirstSong(songId) {
    const playlists = store.get('playlists', []);
    const lastPlaylist = playlists[playlists.length - 1];
    return lastPlaylist && lastPlaylist.songs[0]._id === songId;
  }

  async handlePlaylist(playlist) {
    try {
      logger.info('Handling playlist:', playlist.name);
      
      // Playlist için klasör oluştur
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);
      logger.info(`Created playlist directory: ${playlistDir}`);

      // İlk şarkıyı hemen indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        logger.info('Starting download of first song:', firstSong.name);
        
        // İlk şarkıyı yüksek öncelikle kuyruğa ekle
        downloadQueueManager.addToQueue({
          song: firstSong,
          baseUrl: playlist.baseUrl,
          playlistId: playlist._id,
          priority: 'high'
        });

        // Şarkı yolunu güncelle
        firstSong.localPath = path.join(playlistDir, `${firstSong._id}.mp3`);
        logger.info(`First song local path set to: ${firstSong.localPath}`);
      }

      // Kalan şarkıları kuyruğa ekle
      logger.info(`Adding ${playlist.songs.length - 1} remaining songs to queue`);
      for (let i = 1; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        logger.info(`Adding song to queue: ${song.name}`);
        
        downloadQueueManager.addToQueue({
          song,
          baseUrl: playlist.baseUrl,
          playlistId: playlist._id
        });

        song.localPath = path.join(playlistDir, `${song._id}.mp3`);
      }

      // Store'a playlist bilgisini kaydet
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
      logger.info('Playlist info stored successfully');

      // AudioPlayer'a playlist'i yükle
      audioPlayer.loadPlaylist(updatedPlaylist);
      
      return updatedPlaylist;

    } catch (error) {
      logger.error('Error handling playlist:', error);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();