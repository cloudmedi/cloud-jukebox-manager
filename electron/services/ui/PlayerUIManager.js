class PlayerUIManager {
  static updateCurrentSong(currentSong) {
    console.log('Updating UI with song:', currentSong);
    
    if (!currentSong) {
      console.warn('No song data provided for UI update');
      return;
    }

    const container = document.getElementById('currentSongInfo');
    if (!container) {
      console.error('Current song info container not found! Creating container...');
      this.createContainer();
      return this.updateCurrentSong(currentSong); // Recursive call after creating container
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
    songNameElement.textContent = currentSong.name || 'Unknown Song';
    artistElement.textContent = currentSong.artist || 'Unknown Artist';
    console.log('Song info updated successfully');

    // Tray menüsünü güncelle
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
  }

  static createContainer() {
    console.log('Creating current song info container...');
    const container = document.createElement('div');
    container.id = 'currentSongInfo';
    container.className = 'current-song-info';

    // Boş elementleri oluştur
    const songName = document.createElement('h3');
    songName.className = 'song-name';
    const artistName = document.createElement('p');
    artistName.className = 'artist-name';

    container.appendChild(songName);
    container.appendChild(artistName);

    // Container'ı playlist container'dan önce ekle
    const playlistContainer = document.getElementById('playlistContainer');
    if (playlistContainer) {
      playlistContainer.parentNode.insertBefore(container, playlistContainer);
      console.log('Container created and inserted successfully');
    } else {
      document.querySelector('.container').appendChild(container);
      console.log('Container created and appended to main container');
    }
  }
}

module.exports = PlayerUIManager;