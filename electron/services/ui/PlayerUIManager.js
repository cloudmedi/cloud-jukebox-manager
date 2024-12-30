class PlayerUIManager {
  constructor() {
    this.playlistContainer = document.getElementById('playlistContainer');
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
        // h3 elementini güncelleme (playlist ismi sabit kalacak)
        // Sadece paragraf elementlerini al
        const paragraphs = details.querySelectorAll('p');
        
        // İlk p elementi artist için
        if (paragraphs[0]) {
          paragraphs[0].textContent = currentSong.artist || 'Unknown Artist';
        }
        
        // İkinci p elementi şarkı ismi için
        if (paragraphs[1]) {
          paragraphs[1].textContent = currentSong.name;
        }
      }
    });

    console.log('PlayerUIManager: UI update completed');
  }
}

module.exports = new PlayerUIManager();