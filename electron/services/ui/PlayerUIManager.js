class PlayerUIManager {
  constructor() {
    this.currentSongElement = null;
    this.playlistContainer = document.getElementById('playlistContainer');
  }

  updateCurrentSong(currentSong) {
    if (!this.playlistContainer) {
      console.log('PlayerUIManager: Playlist container not found');
      return;
    }
    
    console.log('PlayerUIManager: Updating current song with:', currentSong);
    
    // Eğer mevcut şarkı elementi varsa, güncelle
    if (this.currentSongElement) {
      const songNameElement = this.currentSongElement.querySelector('h3');
      const artistElement = this.currentSongElement.querySelector('p');
      
      if (songNameElement) {
        songNameElement.textContent = currentSong.name;
      }
      
      if (artistElement) {
        artistElement.textContent = currentSong.artist || 'Unknown Artist';
      }
      
      console.log('PlayerUIManager: Updated existing song element');
    }
  }
}

module.exports = new PlayerUIManager();