const Store = require('electron-store');
const fs = require('fs');
const path = require('path');

class PlaylistManager {
  constructor() {
    this.store = new Store();
  }

  getPlaylists() {
    return this.store.get('playlists', []);
  }

  clearPlaylists() {
    const playlists = this.getPlaylists();
    
    // Playlist dosyalarını ve klasörlerini sil
    playlists.forEach(playlist => {
      playlist.songs.forEach(song => {
        if (song.localPath) {
          try {
            // Şarkı dosyasını sil
            fs.unlinkSync(song.localPath);
            console.log(`Deleted song file: ${song.localPath}`);
            
            // Şarkının bulunduğu klasörü bul ve sil
            const playlistDir = path.dirname(song.localPath);
            if (fs.existsSync(playlistDir)) {
              const files = fs.readdirSync(playlistDir);
              files.forEach(file => {
                const filePath = path.join(playlistDir, file);
                fs.unlinkSync(filePath);
              });
              fs.rmdirSync(playlistDir);
              console.log(`Deleted playlist directory: ${playlistDir}`);
            }
          } catch (error) {
            console.error(`Error deleting files/directory: ${error}`);
          }
        }
      });
    });

    // Store'u temizle
    this.store.delete('playlists');
    console.log('All playlists cleared from store');
  }
}

module.exports = new PlaylistManager();