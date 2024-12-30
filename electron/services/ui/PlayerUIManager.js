class PlayerUIManager {
  constructor() {
    this.playlistContainer = document.getElementById('playlistContainer');
  }

  updateCurrentSong(currentSong) {
    if (!this.playlistContainer) return;
    
    this.playlistContainer.innerHTML = '';
    
    const songElement = document.createElement('div');
    songElement.className = 'playlist-item';
    songElement.innerHTML = `
      <div class="playlist-info">
        ${currentSong.artwork ? 
          `<img src="${currentSong.artwork}" alt="${currentSong.name}" class="playlist-artwork"/>` :
          '<div class="playlist-artwork-placeholder"></div>'
        }
        <div class="playlist-details">
          <h3>${currentSong.name}</h3>
          <p>${currentSong.artist || 'Unknown Artist'}</p>
        </div>
      </div>
    `;
    
    this.playlistContainer.appendChild(songElement);
  }
}

module.exports = new PlayerUIManager();