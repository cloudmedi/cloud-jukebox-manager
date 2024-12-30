class PlayerUIManager {
  static updateCurrentSong(currentSong) {
    console.log('Updating UI with song:', currentSong);
    
    // Mevcut playlist container'ı bul
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) {
      console.error('Playlist container not found!');
      return;
    }

    // Mevcut şarkı bilgisi elementlerini bul
    const songNameElement = playlistContainer.querySelector('.song-name');
    const artistElement = playlistContainer.querySelector('.artist-name');

    if (songNameElement && artistElement) {
      // Varolan elementleri güncelle
      songNameElement.textContent = currentSong.name;
      artistElement.textContent = currentSong.artist || 'Unknown Artist';
      console.log('Updated existing song elements');
    } else {
      console.warn('Song info elements not found in the existing design');
    }

    // Tray menüsünü güncelle
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
  }
}

module.exports = PlayerUIManager;