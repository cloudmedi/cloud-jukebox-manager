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
    // Mesaj tipine göre işleme
    switch (message.action) {
      case 'songRemoved':
        await this.handleSongRemoved(message.data);
        break;
      default:
        await this.handleNewPlaylist(message.data);
    }
  }

  async handleSongRemoved(data) {
    try {
      console.log('Handling song removal:', data);
      const { songId, playlistId } = data;

      // Store'dan mevcut playlistleri al
      const playlists = store.get('playlists', []);
      const playlistIndex = playlists.findIndex(p => p._id === playlistId);

      if (playlistIndex !== -1) {
        const playlist = playlists[playlistIndex];
        
        // Şarkıyı playlistten kaldır
        playlist.songs = playlist.songs.filter(song => song._id !== songId);
        
        // Yerel dosyayı bul ve sil
        const removedSong = playlist.songs.find(s => s._id === songId);
        if (removedSong && removedSong.localPath) {
          try {
            fs.unlinkSync(removedSong.localPath);
            console.log('Deleted local song file:', removedSong.localPath);
          } catch (error) {
            console.error('Error deleting local file:', error);
          }
        }

        // Store'u güncelle
        playlists[playlistIndex] = playlist;
        store.set('playlists', playlists);
        console.log('Updated playlist in store after song removal');
      }
    } catch (error) {
      console.error('Error handling song removal:', error);
      throw error;
    }
  }

  async handleNewPlaylist(playlist) {
    try {
      console.log('Handling new playlist:', playlist.name);
      
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