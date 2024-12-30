class PlayerUIManager {
  constructor() {
    this.playlistContainer = document.getElementById('playlistContainer');
    this.currentSongElement = null;
    this.currentArtwork = null;
  }

  updateCurrentSong(currentSong) {
    if (!this.playlistContainer) {
      console.log('PlayerUIManager: Playlist container not found');
      return;
    }
    
    console.log('PlayerUIManager: Updating current song with:', currentSong);
    
    // Eğer aynı artwork'se tekrar yükleme yapmayalım
    if (this.currentArtwork === currentSong.artwork) {
      console.log('PlayerUIManager: Same artwork, updating song info only');
      if (this.currentSongElement) {
        const songNameElement = this.currentSongElement.querySelector('h3');
        const artistElement = this.currentSongElement.querySelector('p');
        if (songNameElement) songNameElement.textContent = currentSong.name;
        if (artistElement) artistElement.textContent = currentSong.artist || 'Unknown Artist';
      }
      return;
    }
    
    // Mevcut şarkı elementini temizle
    if (this.currentSongElement) {
      this.currentSongElement.remove();
    }
    
    this.currentArtwork = currentSong.artwork;
    
    // Yeni şarkı elementi oluştur
    this.currentSongElement = document.createElement('div');
    this.currentSongElement.className = 'playlist-item';
    
    // ArtworkManager'ı kullan
    const artworkHtml = require('./ArtworkManager').createArtworkHtml(currentSong.artwork, currentSong.name);
    
    this.currentSongElement.innerHTML = `
      <div class="playlist-info">
        ${artworkHtml}
        <div class="playlist-details">
          <h3>${currentSong.name}</h3>
          <p>${currentSong.artist || 'Unknown Artist'}</p>
        </div>
      </div>
    `;
    
    console.log('PlayerUIManager: Created new song element with artwork');
    this.playlistContainer.appendChild(this.currentSongElement);

    // Artwork yükleme durumunu kontrol et
    const artworkImg = this.currentSongElement.querySelector('img');
    if (artworkImg) {
      artworkImg.addEventListener('load', () => {
        console.log('PlayerUIManager: Artwork loaded successfully:', artworkImg.src);
      });
      
      artworkImg.addEventListener('error', (error) => {
        console.error('PlayerUIManager: Artwork loading error:', {
          src: artworkImg.src,
          error: error
        });
      });
    }
  }
}

module.exports = new PlayerUIManager();