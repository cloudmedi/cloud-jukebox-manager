class PlayerUIManager {
  constructor() {
    this.currentSongElement = null;
    this.playlistContainer = document.getElementById('playlistContainer');
    this.songNameElement = null;
    this.artistElement = null;
    
    // İlk yüklemede elementleri oluştur
    this.initializeElements();
    
    console.log('PlayerUIManager initialized:', {
      container: this.playlistContainer ? 'found' : 'not found',
      songElement: this.currentSongElement ? 'created' : 'not created'
    });
  }

  initializeElements() {
    console.log('Initializing UI elements');
    
    if (!this.currentSongElement) {
      this.currentSongElement = document.createElement('div');
      this.currentSongElement.className = 'current-song';
      
      this.songNameElement = document.createElement('h3');
      this.songNameElement.className = 'song-name';
      
      this.artistElement = document.createElement('p');
      this.artistElement.className = 'artist-name';
      
      this.currentSongElement.appendChild(this.songNameElement);
      this.currentSongElement.appendChild(this.artistElement);
      
      if (this.playlistContainer) {
        // Eğer zaten bir current-song elementi varsa onu kaldır
        const existingElement = this.playlistContainer.querySelector('.current-song');
        if (existingElement) {
          existingElement.remove();
        }
        
        this.playlistContainer.appendChild(this.currentSongElement);
        console.log('UI elements added to DOM');
      } else {
        console.error('Playlist container not found during initialization');
      }
    }
  }

  updateCurrentSong(currentSong) {
    console.log('Updating current song:', currentSong);
    
    if (!currentSong) {
      console.warn('No song data provided for update');
      return;
    }

    // DOM elementlerini kontrol et ve gerekirse yeniden oluştur
    if (!this.songNameElement || !this.artistElement) {
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