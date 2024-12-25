class SongInfoUpdater {
  constructor() {
    this.songNameElement = document.querySelector('.song-name');
    this.artistElement = document.querySelector('.song-artist');
    this.artworkContainer = document.querySelector('.playlist-artwork');
  }

  updateSongInfo(song) {
    console.log('Updating song info:', song);
    
    if (!song) {
      console.warn('No song data provided for update');
      return;
    }

    // Update song name
    if (this.songNameElement) {
      this.songNameElement.textContent = song.name || 'Unknown Song';
      console.log('Updated song name:', song.name);
    } else {
      console.warn('Song name element not found');
    }

    // Update artist name
    if (this.artistElement) {
      this.artistElement.textContent = song.artist || 'Unknown Artist';
      console.log('Updated artist name:', song.artist);
    } else {
      console.warn('Artist element not found');
    }

    // Update artwork
    if (this.artworkContainer) {
      if (song.artwork) {
        this.artworkContainer.innerHTML = `<img src="${song.artwork}" alt="${song.name}" class="playlist-artwork"/>`;
        console.log('Updated artwork:', song.artwork);
      } else {
        this.artworkContainer.innerHTML = '<div class="playlist-artwork-placeholder"></div>';
        console.log('Set placeholder artwork');
      }
    } else {
      console.warn('Artwork container not found');
    }
  }
}

module.exports = new SongInfoUpdater();