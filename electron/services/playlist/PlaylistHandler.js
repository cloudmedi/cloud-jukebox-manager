const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const chunkDownloadManager = require('../download/ChunkDownloadManager');
const audioPlayer = require('../audio/AudioPlayer');
const downloadStateManager = require('../download/DownloadStateManager');

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

      // İndirme durumunu kontrol et
      const downloadState = downloadStateManager.getDownloadState(playlist._id);
      const startIndex = downloadState ? downloadState.downloadedSongs : 0;

      // İlk şarkıyı hemen indir (eğer daha önce indirilmediyse)
      if (startIndex === 0) {
        const firstSong = playlist.songs[0];
        if (firstSong) {
          console.log('Starting download of first song:', firstSong.name);
          const firstSongPath = await chunkDownloadManager.downloadSong(
            firstSong,
            playlist.baseUrl,
            playlistDir
          );

          if (firstSongPath) {
            console.log('First song ready:', firstSongPath);
            firstSong.localPath = firstSongPath;
            downloadStateManager.saveDownloadState(playlist._id, 1, playlist.songs.length);
            
            if (audioPlayer && typeof audioPlayer.handleFirstSongReady === 'function') {
              audioPlayer.handleFirstSongReady(firstSong._id, firstSongPath);
            }
          }
        }
      }

      // Kalan şarkıları kuyruğa ekle
      console.log('Adding remaining songs to queue, starting from:', startIndex);
      for (let i = Math.max(1, startIndex); i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Adding song to queue: ${song.name}`);
        
        // Şarkı zaten indirilmiş mi kontrol et
        const expectedPath = path.join(playlistDir, `${song._id}.mp3`);
        if (!fs.existsSync(expectedPath)) {
          chunkDownloadManager.queueSongDownload(
            song,
            playlist.baseUrl,
            playlistDir
          );
        }
        
        song.localPath = path.join(playlistDir, `${song._id}.mp3`);
        downloadStateManager.saveDownloadState(playlist._id, i + 1, playlist.songs.length);
      }

      // Store playlist info
      const updatedPlaylist = {
        ...playlist,
        songs: playlist.songs
      };

      const store = new Store();
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