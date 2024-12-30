class PlayerUIManager {
  static updateCurrentSong(currentSong) {
    console.log('Updating UI with song:', currentSong);
    
    // Her zaman playlistContainer'ı bul
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) {
      console.error('Playlist container not found!');
      return;
    }

    // Eski current-song elementini temizle
    const existingElement = playlistContainer.querySelector('.current-song');
    if (existingElement) {
      existingElement.remove();
    }

    // Yeni current-song elementi oluştur
    const currentSongElement = document.createElement('div');
    currentSongElement.className = 'current-song';
    
    const songNameElement = document.createElement('h3');
    songNameElement.className = 'song-name';
    songNameElement.textContent = currentSong.name;
    
    const artistElement = document.createElement('p');
    artistElement.className = 'artist-name';
    artistElement.textContent = currentSong.artist || 'Unknown Artist';
    
    // Elementleri birleştir
    currentSongElement.appendChild(songNameElement);
    currentSongElement.appendChild(artistElement);
    
    // DOM'a ekle
    playlistContainer.appendChild(currentSongElement);
    
    console.log('UI updated successfully');

    // Tray menüsünü güncelle
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
  }
}

module.exports = PlayerUIManager;