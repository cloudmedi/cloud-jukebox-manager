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

      // İlk şarkıyı hemen indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        console.log('Starting download of first song:', firstSong.name);
        const firstSongPath = await chunkDownloadManager.downloadSongInChunks(
          firstSong,
          playlist.baseUrl,
          playlistDir
        );

        // İlk şarkı hazır olduğunda oynatıcıya bildir
        if (firstSongPath) {
          console.log('First song ready:', firstSongPath);
          audioPlayer.handleFirstSongReady(firstSong._id, firstSongPath);
        }
      }

      // Kalan şarkıları kuyruğa ekle
      console.log('Adding remaining songs to queue');
      for (let i = 1; i < playlist.songs.length; i++) {
        console.log(`Adding song to queue: ${playlist.songs[i].name}`);
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