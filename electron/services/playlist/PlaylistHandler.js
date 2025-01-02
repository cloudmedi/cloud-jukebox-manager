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
    this.activeDownloads = new Set();
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  setupChunkDownloadListeners() {
    chunkDownloadManager.on('firstChunkReady', ({ songId, songPath, buffer }) => {
      console.log(`First chunk ready for song ${songId}, path: ${songPath}`);
      audioPlayer.handleFirstChunkReady(songId, songPath, buffer);
    });

    chunkDownloadManager.on('progress', ({ songId, progress, isComplete }) => {
      console.log(`Download progress for ${songId}: ${progress}%`);
      if (isComplete) {
        console.log(`Download completed for song ${songId}`);
        this.activeDownloads.delete(songId);
      }
    });
  }

  async handlePlaylist(playlist) {
    try {
      console.log('Handling playlist:', playlist.name);
      
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // Tüm şarkıları paralel olarak indirmeye başla
      const downloadPromises = playlist.songs.map(async (song, index) => {
        if (this.activeDownloads.has(song._id)) {
          console.log(`Song ${song.name} is already being downloaded`);
          return;
        }

        this.activeDownloads.add(song._id);
        
        try {
          await chunkDownloadManager.downloadSongInChunks(
            song,
            playlist.baseUrl,
            playlistDir
          );

          // Şarkı yolunu güncelle
          song.localPath = path.join(playlistDir, `${song._id}.mp3`);
          
          console.log(`Successfully downloaded song: ${song.name}`);
        } catch (error) {
          console.error(`Error downloading song ${song.name}:`, error);
          this.activeDownloads.delete(song._id);
        }
      });

      // Tüm indirme işlemlerinin tamamlanmasını bekle
      await Promise.all(downloadPromises);

      // Store playlist info
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