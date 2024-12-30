class PlayerUIManager {
  constructor() {
    this.playlistContainer = document.getElementById('playlistContainer');
    this.currentArtwork = null; // Mevcut artwork'ü takip etmek için
  }

  updateCurrentSong(currentSong) {
    if (!this.playlistContainer) return;
    
    console.log('PlayerUIManager: Updating current song with:', currentSong);
    
    // Eğer aynı artwork'se tekrar yükleme yapmayalım
    if (this.currentArtwork === currentSong.artwork) {
      console.log('PlayerUIManager: Same artwork, skipping update');
      return;
    }
    
    this.currentArtwork = currentSong.artwork;
    this.playlistContainer.innerHTML = '';
    
    const songElement = document.createElement('div');
    songElement.className = 'playlist-item';
    
    // ArtworkManager'ı kullan
    const artworkHtml = require('./ArtworkManager').createArtworkHtml(currentSong.artwork, currentSong.name);
    
    songElement.innerHTML = `
      <div class="playlist-info">
        ${artworkHtml}
        <div class="playlist-details">
          <h3>${currentSong.name}</h3>
          <p>${currentSong.artist || 'Unknown Artist'}</p>
        </div>
      </div>
    `;
    
    console.log('PlayerUIManager: Created new song element with artwork');
    this.playlistContainer.appendChild(songElement);
  }
}

module.exports = new PlayerUIManager();