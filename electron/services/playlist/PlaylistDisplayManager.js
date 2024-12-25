const { ipcRenderer } = require('electron');
const artworkManager = require('../artwork/ArtworkManager');

class PlaylistDisplayManager {
  async displayPlaylists() {
    const playlists = store.get('playlists', []);
    const playlistContainer = document.getElementById('playlistContainer');
    
    if (!playlistContainer) {
      console.error('Playlist container bulunamadı');
      return;
    }
    
    playlistContainer.innerHTML = '';
    
    // Son playlist'i göster
    const lastPlaylist = playlists[playlists.length - 1];
    if (lastPlaylist) {
      try {
        // Artwork'ü indir ve yerel path al
        const localArtworkPath = lastPlaylist.artwork ? 
          await artworkManager.downloadArtwork(lastPlaylist.artwork, lastPlaylist._id) : 
          null;

        const playlistElement = document.createElement('div');
        playlistElement.className = 'playlist-item';
        playlistElement.innerHTML = `
          <div class="playlist-info">
            ${localArtworkPath ? 
              `<img src="file://${localArtworkPath}" alt="${lastPlaylist.name}" class="playlist-artwork" onerror="this.src='/placeholder.svg'"/>` :
              '<div class="playlist-artwork-placeholder"></div>'
            }
            <div class="playlist-details">
              <h3>${lastPlaylist.name}</h3>
              <p>${lastPlaylist.songs[0]?.artist || 'Unknown Artist'}</p>
              <p>${lastPlaylist.songs[0]?.name || 'No songs'}</p>
            </div>
          </div>
        `;
        
        playlistContainer.appendChild(playlistElement);
        console.log('Displayed playlist:', lastPlaylist.name);
      } catch (error) {
        console.error('Playlist görüntüleme hatası:', error);
      }
    }
  }
}

module.exports = new PlaylistDisplayManager();