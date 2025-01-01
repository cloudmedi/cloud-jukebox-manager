const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const chunkDownloadManager = require('../download/ChunkDownloadManager');
const audioPlayer = require('../audio/AudioPlayer');
const storageService = require('../storage/StorageService');

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
    this.setupChunkDownloadListeners();
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  setupChunkDownloadListeners() {
    chunkDownloadManager.on('firstChunkReady', ({ songId, songPath }) => {
      console.log(`First chunk ready for song ${songId}, path: ${songPath}`);
      audioPlayer.handleFirstChunkReady(songId, songPath);
    });

    chunkDownloadManager.on('progress', ({ songId, progress, isComplete }) => {
      console.log(`Download progress for ${songId}: ${progress}%`);
      if (isComplete) {
        console.log(`Download completed for song ${songId}`);
      }
    });
  }

  async handlePlaylist(playlist) {
    try {
      console.log('Handling playlist:', playlist.name);
      
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // URL'leri düzgün formatta oluştur
      const baseUrl = playlist.baseUrl.endsWith('/') ? playlist.baseUrl : `${playlist.baseUrl}/`;
      
      // İlk şarkıyı hemen indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        // filePath'deki Windows tarzı ters eğik çizgileri düzelt
        const normalizedPath = firstSong.filePath.replace(/\\/g, '/');
        // URL'yi doğru şekilde oluştur
        const songUrl = `${baseUrl}${normalizedPath}`;
        console.log('Downloading first song from URL:', songUrl);
        
        await chunkDownloadManager.downloadSongInChunks(
          firstSong,
          baseUrl,
          playlistDir
        );
      }

      // Kalan şarkıları kuyruğa al
      for (let i = 1; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        const normalizedPath = song.filePath.replace(/\\/g, '/');
        console.log(`Queueing song ${i + 1}/${playlist.songs.length}: ${normalizedPath}`);
        
        chunkDownloadManager.addToQueue(
          song,
          baseUrl,
          playlistDir
        );
      }

      // Playlist bilgisini sakla
      const updatedPlaylist = {
        ...playlist,
        songs: playlist.songs.map(song => ({
          ...song,
          localPath: path.join(playlistDir, `${song._id}.mp3`)
        }))
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
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();