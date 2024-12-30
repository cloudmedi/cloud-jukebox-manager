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
    
    // Tüm playlist-item elementlerini güncelle
    const playlistItems = this.playlistContainer.getElementsByClassName('playlist-item');
    
    // Her playlist-item için güncelleme yap
    Array.from(playlistItems).forEach(item => {
      // Artwork güncelleme
      const artworkContainer = item.querySelector('.playlist-artwork-placeholder');
      if (artworkContainer && currentSong.artwork) {
        // Placeholder'ı kaldır ve img ekle
        const img = document.createElement('img');
        img.src = `http://localhost:5000${currentSong.artwork}`;
        img.alt = currentSong.name;
        img.className = 'playlist-artwork';
        img.onerror = (error) => {
          console.error('PlayerUIManager: Artwork loading error:', {
            src: img.src,
            error: error
          });
          // Hata durumunda placeholder'a geri dön
          const placeholder = document.createElement('div');
          placeholder.className = 'playlist-artwork-placeholder';
          img.replaceWith(placeholder);
        };
        
        img.onload = () => {
          console.log('PlayerUIManager: Artwork loaded successfully:', img.src);
        };
        
        artworkContainer.replaceWith(img);
      }

      // Şarkı bilgilerini güncelle
      const details = item.querySelector('.playlist-details');
      if (details) {
        const songName = details.querySelector('h3');
        const artistName = details.querySelector('p');
        
        if (songName) songName.textContent = currentSong.name;
        if (artistName) artistName.textContent = currentSong.artist;
      }
    });

    console.log('PlayerUIManager: UI update completed');
  }
}

module.exports = new PlayerUIManager();