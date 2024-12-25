const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const ArtworkManager = require('../artwork/ArtworkManager');

class PlaylistManager {
  constructor() {
    this.store = new Store();
  }

  async savePlaylist(playlist) {
    try {
      // Eski playlistleri ve şarkıları temizle
      await this.cleanupOldPlaylists();

      // Artwork'ü kaydet
      if (playlist.artwork) {
        const localArtworkPath = ArtworkManager.saveArtwork(playlist.artwork, playlist._id);
        if (localArtworkPath) {
          playlist.artwork = localArtworkPath;
        }
      }

      // Yeni playlisti kaydet
      const playlists = [playlist];
      this.store.set('playlists', playlists);

      return playlist;
    } catch (error) {
      console.error('Playlist kaydetme hatası:', error);
      throw error;
    }
  }

  async cleanupOldPlaylists() {
    try {
      const playlists = this.store.get('playlists', []);
      
      // Her playlist için şarkı dosyalarını ve klasörlerini sil
      for (const playlist of playlists) {
        if (playlist.songs) {
          for (const song of playlist.songs) {
            if (song.localPath && fs.existsSync(song.localPath)) {
              fs.unlinkSync(song.localPath);
              
              // Şarkının bulunduğu klasörü bul ve temizle
              const songDir = path.dirname(song.localPath);
              const files = fs.readdirSync(songDir);
              files.forEach(file => {
                const filePath = path.join(songDir, file);
                fs.unlinkSync(filePath);
              });
              
              // Boş klasörü sil
              if (fs.existsSync(songDir)) {
                fs.rmdirSync(songDir);
              }
            }
          }
        }
      }

      // Store'u temizle
      this.store.delete('playlists');
    } catch (error) {
      console.error('Playlist temizleme hatası:', error);
    }
  }

  getPlaylists() {
    return this.store.get('playlists', []);
  }
}

module.exports = new PlaylistManager();