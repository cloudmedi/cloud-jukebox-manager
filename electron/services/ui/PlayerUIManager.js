class PlayerUIManager {
  static updateCurrentSong(currentSong) {
    console.log('Updating UI with song:', currentSong);
    
    if (!currentSong) {
      console.warn('No song data provided for UI update');
      return;
    }

    const container = document.getElementById('currentSongInfo');
    if (!container) {
      console.error('Current song info container not found!');
      return;
    }

    let songNameElement = container.querySelector('.song-name');
    let artistElement = container.querySelector('.artist-name');

    if (!songNameElement || !artistElement) {
      console.log('Creating new song info elements...');
      
      // Varolan içeriği temizle
      container.innerHTML = '';
      
      // Yeni elementleri oluştur
      songNameElement = document.createElement('h3');
      songNameElement.className = 'song-name';
      
      artistElement = document.createElement('p');
      artistElement.className = 'artist-name';
      
      // Elementleri container'a ekle
      container.appendChild(songNameElement);
      container.appendChild(artistElement);
    }

    // Elementleri güncelle
    songNameElement.textContent = currentSong.name;
    artistElement.textContent = currentSong.artist || 'Unknown Artist';
    console.log('Song info updated successfully');

    // Tray menüsünü güncelle
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
  }
}

module.exports = PlayerUIManager;