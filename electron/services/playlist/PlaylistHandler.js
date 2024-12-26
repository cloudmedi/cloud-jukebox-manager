const { ipcRenderer } = require('electron');
const { downloadFile } = require('../downloadUtils');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

class PlaylistHandler {
  constructor() {
    this.store = new Store();
    this.setupListeners();
  }

  setupListeners() {
    ipcRenderer.on('play-playlist', async (event, playlist) => {
      console.log('Received playlist for processing:', playlist);
      await this.handlePlaylist(playlist);
    });
  }

  async handlePlaylist(playlist) {
    try {
      // Playlist için indirme klasörünü oluştur
      const playlistDir = path.join(process.env.APPDATA || process.env.HOME, 'cloud-media-player', 'playlists', playlist._id);
      
      if (!fs.existsSync(playlistDir)) {
        fs.mkdirSync(playlistDir, { recursive: true });
      }

      console.log('Processing songs:', playlist.songs);

      const processedSongs = [];

      for (const song of playlist.songs) {
        const songPath = path.join(playlistDir, `${song._id}.mp3`);
        const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

        console.log('Downloading song:', {
          name: song.name,
          url: songUrl,
          path: songPath
        });

        // İndirme durumunu bildir
        ipcRenderer.send('download-progress', {
          songName: song.name,
          progress: 0
        });

        try {
          await downloadFile(songUrl, songPath, (progress) => {
            ipcRenderer.send('download-progress', {
              songName: song.name,
              progress
            });
          });

          // Şarkı yolunu güncelle ve işlenmiş şarkılar listesine ekle
          processedSongs.push({
            ...song,
            localPath: songPath
          });

        } catch (error) {
          console.error(`Error downloading song ${song.name}:`, error);
          ipcRenderer.send('download-progress', {
            songName: song.name,
            error: error.message
          });
        }
      }

      // Playlist'i güncelle ve store'a kaydet
      const updatedPlaylist = {
        ...playlist,
        songs: processedSongs
      };

      // Store'a kaydet
      const playlists = this.store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = updatedPlaylist;
      } else {
        playlists.push(updatedPlaylist);
      }
      
      this.store.set('playlists', playlists);

      // Playlist hazır, oynatıcıyı güncelle
      ipcRenderer.send('update-player', {
        type: 'playlist-ready',
        playlist: updatedPlaylist
      });

      return updatedPlaylist;

    } catch (error) {
      console.error('Error handling playlist:', error);
      ipcRenderer.send('error', {
        type: 'playlist-error',
        message: error.message
      });
      throw error;
    }
  }

  // Playlist silme işleyicisi
  handlePlaylistDeleted(playlistId) {
    const playlists = this.store.get('playlists', []);
    const playlistToDelete = playlists.find(p => p._id === playlistId);
    
    if (playlistToDelete) {
      // Playlist'i store'dan kaldır
      this.store.set('playlists', playlists.filter(p => p._id !== playlistId));
      
      // Playlist dosyalarını temizle
      const playlistDir = path.join(process.env.APPDATA || process.env.HOME, 'cloud-media-player', 'playlists', playlistId);
      if (fs.existsSync(playlistDir)) {
        fs.rmSync(playlistDir, { recursive: true, force: true });
      }
      
      // Eğer bu playlist çalıyorsa durdur
      ipcRenderer.send('stop-playlist', playlistId);
    }
  }
}

module.exports = new PlaylistHandler();