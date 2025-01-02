const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const chunkDownloadManager = require('../download/managers/ChunkDownloadManager');
const downloadProgressService = require('../download/DownloadProgressService');
const audioPlayer = require('../audio/AudioPlayer');
const websocketService = require('../websocketService');

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
      console.log(`Song ${songId} downloaded successfully`);
    });
  }

  async handlePlaylist(playlist) {
    try {
      console.log('Handling playlist:', playlist.name);
      
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // İndirme durumunu başlat
      downloadProgressService.initializeDownload(
        playlist.deviceToken,
        playlist._id,
        playlist.songs.length
      );

      // İlk şarkıyı hemen indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        console.log('Starting download of first song:', firstSong.name);
        const firstSongPath = await chunkDownloadManager.downloadSong(
          firstSong,
          playlist.baseUrl,
          playlistDir,
          playlist._id
        );

        if (firstSongPath) {
          console.log('First song ready:', firstSongPath);
          firstSong.localPath = firstSongPath;
          if (audioPlayer && typeof audioPlayer.handleFirstSongReady === 'function') {
            audioPlayer.handleFirstSongReady(firstSong._id, firstSongPath);
          }
        }
      }

      // Kalan şarkıları kuyruğa ekle
      console.log('Adding remaining songs to queue');
      for (let i = 1; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Adding song to queue: ${song.name}`);
        chunkDownloadManager.queueSongDownload(
          song,
          playlist.baseUrl,
          playlistDir,
          playlist._id
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
      console.error('Error handling playlist:', error);
      downloadProgressService.handleError(playlist._id, error);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();