const { ipcRenderer } = require('electron');

class PlaylistDisplay {
  constructor() {
    this.container = document.getElementById('playlistContainer');
  }

  displayPlaylist(playlist) {
    if (!this.container) return;

    this.container.innerHTML = '';
    
    if (playlist) {
      const playlistElement = document.createElement('div');
      playlistElement.className = 'playlist-item';
      playlistElement.innerHTML = `
        <div class="playlist-info">
          ${playlist.artwork ? 
            `<img src="${playlist.artwork}" alt="${playlist.name}" class="playlist-artwork"/>` :
            '<div class="playlist-artwork-placeholder"></div>'
          }
          <div class="playlist-details">
            <h3>${playlist.name}</h3>
            <p>${playlist.songs[0]?.artist || 'Unknown Artist'}</p>
            <p>${playlist.songs[0]?.name || 'No songs'}</p>
          </div>
        </div>
      `;
      
      this.container.appendChild(playlistElement);
      this.show();
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }
}

module.exports = PlaylistDisplay;