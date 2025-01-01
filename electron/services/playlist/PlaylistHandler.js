const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const chunkDownloadManager = require('../download/ChunkDownloadManager');
const audioPlayer = require('../audio/AudioPlayer');

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
      // Notify audio player that first chunk is ready
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

      // Start downloading first song immediately
      const firstSong = playlist.songs[0];
      if (firstSong) {
        await chunkDownloadManager.downloadSongInChunks(
          firstSong,
          playlist.baseUrl,
          playlistDir
        );
      }

      // Queue remaining songs for download
      for (let i = 1; i < playlist.songs.length; i++) {
        chunkDownloadManager.addToQueue(
          playlist.songs[i],
          playlist.baseUrl,
          playlistDir
        );
      }

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