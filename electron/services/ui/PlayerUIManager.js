class PlayerUIManager {
  constructor() {
    this.songNameElement = null;
    this.artistElement = null;
    this.currentSongElement = null;
    this.playlistContainer = null;
    
    // DOM yüklendikten sonra elementleri initialize et
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeElements();
    });
  }

  initializeElements() {
    console.log('Initializing UI elements');
    
    // Önce container'ı bul
    this.playlistContainer = document.getElementById('playlistContainer');
    if (!this.playlistContainer) {
      console.error('Playlist container not found!');
      return;
    }

    // Eski current-song elementini temizle
    const existingElement = this.playlistContainer.querySelector('.current-song');
    if (existingElement) {
      existingElement.remove();
    }

    // Yeni elementleri oluştur
    this.currentSongElement = document.createElement('div');
    this.currentSongElement.className = 'current-song';
    
    this.songNameElement = document.createElement('h3');
    this.songNameElement.className = 'song-name';
    
    this.artistElement = document.createElement('p');
    this.artistElement.className = 'artist-name';
    
    // Elementleri birleştir
    this.currentSongElement.appendChild(this.songNameElement);
    this.currentSongElement.appendChild(this.artistElement);
    
    // DOM'a ekle
    this.playlistContainer.appendChild(this.currentSongElement);
    
    console.log('UI elements initialized successfully');
  }

  updateCurrentSong(currentSong) {
    console.log('Updating current song:', currentSong);
    
    if (!currentSong) {
      console.warn('No song data provided for update');
      return;
    }

    // Elementleri kontrol et ve gerekirse yeniden oluştur
    if (!this.songNameElement || !this.artistElement || !this.currentSongElement) {
      console.log('UI elements missing, reinitializing...');
      this.initializeElements();
    }

    // Şarkı bilgilerini güncelle
    if (this.songNameElement) {
      this.songNameElement.textContent = currentSong.name;
      console.log('Updated song name:', currentSong.name);
    }
    
    if (this.artistElement) {
      this.artistElement.textContent = currentSong.artist || 'Unknown Artist';
      console.log('Updated artist name:', currentSong.artist);
    }

    // Tray menüsünü güncelle
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
    
    console.log('UI update completed successfully');
  }
}

module.exports = new PlayerUIManager();