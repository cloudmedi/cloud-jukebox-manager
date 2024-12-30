class PlaylistDisplayManager {
  static displayPlaylists() {
    console.log('8. Starting displayPlaylists()');
    const Store = require('electron-store');
    const store = new Store();
    const playlists = store.get('playlists', []);
    const playlistContainer = document.getElementById('playlistContainer');
    
    if (!playlistContainer) {
      console.error('9. Playlist container not found');
      return;
    }
    
    console.log('10. Current playlists:', playlists);
    
    playlistContainer.innerHTML = '';
    
    // Son playlist'i göster
    const lastPlaylist = playlists[playlists.length - 1];
    if (lastPlaylist) {
      console.log('11. Displaying last playlist:', lastPlaylist);
      const playlistElement = document.createElement('div');
      playlistElement.className = 'playlist-item';
      
      // Artwork URL'ini baseUrl ile birleştir
      const artworkUrl = lastPlaylist.artwork ? 
        `${lastPlaylist.baseUrl || 'http://localhost:5000'}${lastPlaylist.artwork}` : 
        null;
      
      playlistElement.innerHTML = `
        <div class="playlist-info">
          ${artworkUrl ? 
            `<img src="${artworkUrl}" alt="${lastPlaylist.name}" class="playlist-artwork"/>` :
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
      console.log('12. Playlist element added to DOM');
    } else {
      console.warn('13. No playlist available to display');
    }
  }
}

module.exports = PlaylistDisplayManager;