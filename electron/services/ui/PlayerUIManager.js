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
    
    try {
      // Aktif şarkıyı bul
      const currentItem = this.playlistContainer.querySelector(`.playlist-item[data-index="${currentSong.index}"]`);
      if (!currentItem) {
        console.log('PlayerUIManager: Current song item not found in playlist');
        return;
      }

      // Artwork güncelleme
      const artworkContainer = currentItem.querySelector('.playlist-artwork-placeholder');
      if (artworkContainer && currentSong.artwork) {
        // Placeholder'ı kaldır ve img ekle
        const img = document.createElement('img');
        img.src = currentSong.artwork;
        img.alt = currentSong.name;
        img.className = 'playlist-artwork';
        img.onerror = () => {
          // Hata durumunda placeholder'a geri dön
          const placeholder = document.createElement('div');
          placeholder.className = 'playlist-artwork-placeholder';
          img.replaceWith(placeholder);
        };
        
        artworkContainer.replaceWith(img);
      }

      // Şarkı bilgilerini güncelle
      const details = currentItem.querySelector('.playlist-details');
      if (details) {
        const titleEl = details.querySelector('h3');
        const artistEl = details.querySelector('p');
        
        if (titleEl) titleEl.textContent = currentSong.name || 'Unknown Song';
        if (artistEl) artistEl.textContent = currentSong.artist || 'Unknown Artist';
      }

      // Aktif şarkı vurgulaması
      Array.from(this.playlistContainer.querySelectorAll('.playlist-item')).forEach(item => {
        if (item === currentItem) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      console.log('PlayerUIManager: UI update completed successfully');
    } catch (error) {
      console.error('PlayerUIManager: Error updating UI:', error);
    }
  }
}

module.exports = new PlayerUIManager();