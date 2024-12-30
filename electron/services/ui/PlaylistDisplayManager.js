const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const ArtworkManager = require('./ArtworkManager');

class PlaylistDisplayManager {
  constructor() {
    this.playlistContainer = document.getElementById('playlistContainer');
  }

  displayPlaylists() {
    console.log('=== PLAYLIST DISPLAY DEBUG LOGS ===');
    console.log('1. Starting displayPlaylists()');
    const playlists = store.get('playlists', []);
    
    if (!this.playlistContainer) {
      console.error('2. Playlist container not found');
      return;
    }
    
    console.log('3. Current playlists in store:', playlists);
    
    // Mevcut içeriği temizle
    this.playlistContainer.innerHTML = '';
    
    // Son playlist'i göster
    const lastPlaylist = playlists[playlists.length - 1];
    if (lastPlaylist) {
      console.log('4. Last playlist details:', {
        id: lastPlaylist._id,
        name: lastPlaylist.name,
        songCount: lastPlaylist.songs.length,
        firstSong: lastPlaylist.songs[0]
      });

      console.log('5. Artwork details:', {
        hasArtwork: !!lastPlaylist.artwork,
        artworkPath: lastPlaylist.artwork,
        fullArtworkUrl: ArtworkManager.getArtworkUrl(lastPlaylist.artwork)
      });

      const playlistElement = document.createElement('div');
      playlistElement.className = 'playlist-item';
      
      const artworkHtml = ArtworkManager.createArtworkHtml(lastPlaylist.artwork, lastPlaylist.name);
      
      console.log('6. Generated artwork HTML:', artworkHtml);
      
      playlistElement.innerHTML = `
        <div class="playlist-info">
          ${artworkHtml}
          <div class="playlist-details">
            <h3>${lastPlaylist.name}</h3>
            <p>${lastPlaylist.songs[0]?.artist || 'Unknown Artist'}</p>
            <p>${lastPlaylist.songs[0]?.name || 'No songs'}</p>
          </div>
        </div>
      `;
      
      console.log('7. Playlist element created with artwork');
      this.playlistContainer.appendChild(playlistElement);
      console.log('8. Playlist element added to DOM');

      // Artwork yükleme durumunu kontrol et
      const artworkImg = playlistElement.querySelector('img');
      if (artworkImg) {
        artworkImg.addEventListener('load', () => {
          console.log('9. Artwork başarıyla yüklendi:', artworkImg.src);
        });
        
        artworkImg.addEventListener('error', (error) => {
          console.error('10. Artwork yükleme hatası:', {
            src: artworkImg.src,
            error: error
          });
        });
      }
    } else {
      console.warn('11. No playlist available to display');
    }
    console.log('=== END PLAYLIST DISPLAY DEBUG LOGS ===');
  }
}

module.exports = new PlaylistDisplayManager();