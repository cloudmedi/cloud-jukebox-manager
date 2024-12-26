const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Store = require('electron-store');
const store = new Store();

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async handlePlaylist(message) {
    console.log('PlaylistHandler received message:', message);

    // Playlist silme kontrolü
    if (message.action === 'deleted') {
      console.log('Handling playlist deletion for ID:', message.playlistId);
      try {
        // Store'dan playlistleri al
        const playlists = store.get('playlists', []);
        console.log('Current playlists in store:', playlists.map(p => p._id));
        
        // Silinecek playlist'i bul
        const playlistToDelete = playlists.find(p => p._id === message.playlistId);
        
        if (playlistToDelete) {
          console.log('Found playlist to delete:', playlistToDelete.name);
          
          // Playlist klasörünü sil
          const playlistDir = path.join(this.downloadPath, playlistToDelete._id);
          if (fs.existsSync(playlistDir)) {
            fs.rmdirSync(playlistDir, { recursive: true });
            console.log('Deleted playlist directory:', playlistDir);
          }
          
          // Store'dan playlist'i kaldır
          const updatedPlaylists = playlists.filter(p => p._id !== message.playlistId);
          store.set('playlists', updatedPlaylists);
          console.log('Updated playlists in store. Removed playlist:', message.playlistId);
          
          // Renderer'a bildir
          const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.webContents.send('playlist-deleted', message.playlistId);
            console.log('Sent playlist-deleted event to renderer');
          }
        } else {
          console.log('Playlist not found in store:', message.playlistId);
        }
      } catch (error) {
        console.error('Error deleting playlist:', error);
        throw error;
      }
      return;
    }

    try {
      console.log('Processing playlist:', message.data);
      const playlist = message.data;
      
      // Playlist için klasör oluştur
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // Şarkıları indir ve localPath'leri güncelle
      const updatedSongs = await Promise.all(
        playlist.songs.map(async (song) => {
          try {
            const songPath = path.join(playlistDir, `${song._id}.mp3`);
            const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

            // Şarkı zaten indirilmiş mi kontrol et
            if (!fs.existsSync(songPath)) {
              console.log(`Downloading song: ${song.name}`);
              await this.downloadFile(songUrl, songPath);
            }

            return {
              ...song,
              localPath: songPath
            };
          } catch (error) {
            console.error(`Error downloading song ${song.name}:`, error);
            return song;
          }
        })
      );

      // Güncellenmiş playlist'i oluştur
      const updatedPlaylist = {
        ...playlist,
        songs: updatedSongs
      };

      // Local storage'a kaydet
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

  async downloadFile(url, filePath) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}

module.exports = new PlaylistHandler();
