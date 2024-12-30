class PlayerUIManager {
  static updateCurrentSong(currentSong) {
    console.log('Updating UI with song:', currentSong);
    
    if (!currentSong) {
      console.warn('No song data provided for UI update');
      return;
    }

    // Query selectors'ı daha spesifik hale getirelim
    const songNameElement = document.querySelector('.current-song-info .song-name');
    const artistElement = document.querySelector('.current-song-info .artist-name');

    if (!songNameElement || !artistElement) {
      console.error('Song info elements not found. Creating elements...');
      this.createSongInfoElements(currentSong);
      return;
    }

    // Varolan elementleri güncelle
    songNameElement.textContent = currentSong.name;
    artistElement.textContent = currentSong.artist || 'Unknown Artist';
    console.log('Updated existing song elements successfully');

    // Tray menüsünü güncelle
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
  }

  static createSongInfoElements(currentSong) {
    // Önce container'ı bul
    const container = document.querySelector('.current-song-info');
    if (!container) {
      console.error('Current song info container not found!');
      return;
    }

    // Container'ı temizle
    container.innerHTML = '';

    // Yeni elementleri oluştur
    const songName = document.createElement('h3');
    songName.className = 'song-name';
    songName.textContent = currentSong.name;

    const artistName = document.createElement('p');
    artistName.className = 'artist-name';
    artistName.textContent = currentSong.artist || 'Unknown Artist';

    // Elementleri container'a ekle
    container.appendChild(songName);
    container.appendChild(artistName);

    console.log('Created new song info elements');
  }
}

module.exports = PlayerUIManager;