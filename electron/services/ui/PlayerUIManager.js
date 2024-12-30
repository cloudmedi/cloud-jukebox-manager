class PlayerUIManager {
  constructor() {
    this.currentSongElement = null;
    this.playlistContainer = document.getElementById('playlistContainer');
    this.songNameElement = null;
    this.artistElement = null;
    
    // İlk yüklemede elementleri oluştur
    this.initializeElements();
  }

  initializeElements() {
    if (!this.currentSongElement) {
      this.currentSongElement = document.createElement('div');
      this.currentSongElement.className = 'current-song';
      
      this.songNameElement = document.createElement('h3');
      this.artistElement = document.createElement('p');
      
      this.currentSongElement.appendChild(this.songNameElement);
      this.currentSongElement.appendChild(this.artistElement);
      
      if (this.playlistContainer) {
        this.playlistContainer.appendChild(this.currentSongElement);
      }
    }
  }

  updateCurrentSong(currentSong) {
    console.log('PlayerUIManager: Updating current song with:', currentSong);
    
    if (!currentSong) {
      console.log('PlayerUIManager: No song data provided');
      return;
    }

    // Elementleri güncelle
    if (this.songNameElement) {
      this.songNameElement.textContent = currentSong.name;
    }
    
    if (this.artistElement) {
      this.artistElement.textContent = currentSong.artist || 'Unknown Artist';
    }

    // Tray menüsünü güncelle
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
    
    console.log('PlayerUIManager: UI updated successfully');
  }
}

module.exports = new PlayerUIManager();