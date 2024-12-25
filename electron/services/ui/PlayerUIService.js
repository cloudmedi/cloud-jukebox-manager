class PlayerUIService {
  updateSongInfo(song) {
    if (!song) return;

    // Şarkı adını güncelle
    const songNameElement = document.querySelector('.song-name');
    if (songNameElement) {
      songNameElement.textContent = song.name || 'Unknown Song';
    }

    // Sanatçı adını güncelle
    const artistElement = document.querySelector('.song-artist');
    if (artistElement) {
      artistElement.textContent = song.artist || 'Unknown Artist';
    }

    // Artwork'ü güncelle
    const artworkContainer = document.querySelector('.playlist-artwork');
    if (artworkContainer) {
      if (song.artwork) {
        artworkContainer.innerHTML = `<img src="${song.artwork}" alt="${song.name}" class="playlist-artwork"/>`;
      } else {
        artworkContainer.innerHTML = '<div class="playlist-artwork-placeholder"></div>';
      }
    }

    console.log('UI updated with new song info:', song);
  }
}

module.exports = new PlayerUIService();