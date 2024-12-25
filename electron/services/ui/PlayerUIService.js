class PlayerUIService {
  updateSongInfo(song) {
    if (!song) {
      console.log('No song provided to update UI');
      return;
    }

    console.log('Updating UI with song:', song);

    // Şarkı adını güncelle
    const songNameElement = document.querySelector('.song-name');
    if (songNameElement) {
      songNameElement.textContent = song.name;
      console.log('Updated song name to:', song.name);
    } else {
      console.warn('Song name element not found');
    }

    // Sanatçı adını güncelle
    const artistElement = document.querySelector('.song-artist');
    if (artistElement) {
      artistElement.textContent = song.artist || 'Unknown Artist';
      console.log('Updated artist name to:', song.artist);
    } else {
      console.warn('Artist element not found');
    }

    // Artwork'ü güncelle
    const artworkContainer = document.querySelector('.playlist-artwork');
    if (artworkContainer) {
      if (song.artwork) {
        artworkContainer.innerHTML = `<img src="${song.artwork}" alt="${song.name}" class="playlist-artwork"/>`;
        console.log('Updated artwork with:', song.artwork);
      } else {
        artworkContainer.innerHTML = '<div class="playlist-artwork-placeholder"></div>';
        console.log('Set placeholder artwork');
      }
    } else {
      console.warn('Artwork container not found');
    }
  }
}

module.exports = new PlayerUIService();