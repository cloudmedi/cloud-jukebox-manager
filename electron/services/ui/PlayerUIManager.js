class PlayerUIManager {
  constructor() {
    this.playlistContainer = document.getElementById('playlistContainer');
    this.currentSongInfo = document.getElementById('currentSongInfo');
    this.songArtwork = document.getElementById('songArtwork');
    this.songName = document.getElementById('songName');
    this.songArtist = document.getElementById('songArtist');
    
    console.log('PlayerUIManager initialized:', {
      playlistContainer: !!this.playlistContainer,
      currentSongInfo: !!this.currentSongInfo,
      songArtwork: !!this.songArtwork,
      songName: !!this.songName,
      songArtist: !!this.songArtist
    });
  }

  updateCurrentSong(currentSong) {
    console.log('Updating UI with song:', currentSong);

    if (!this.currentSongInfo) {
      console.error('Current song info container not found!');
      return;
    }

    // Update song details
    if (this.songName) this.songName.textContent = currentSong.name;
    if (this.songArtist) this.songArtist.textContent = currentSong.artist;

    // Update artwork
    if (this.songArtwork) {
      if (currentSong.artwork) {
        const artworkUrl = this.getArtworkUrl(currentSong.artwork);
        console.log('Setting artwork URL:', artworkUrl);
        
        this.songArtwork.onerror = (error) => {
          console.error('Artwork loading error:', error);
          this.songArtwork.src = '/placeholder.svg';
        };

        this.songArtwork.onload = () => {
          console.log('Artwork loaded successfully:', artworkUrl);
        };

        this.songArtwork.src = artworkUrl;
      } else {
        console.log('No artwork available, using placeholder');
        this.songArtwork.src = '/placeholder.svg';
      }
    }
  }

  getArtworkUrl(artwork) {
    if (!artwork) return null;
    const url = `http://localhost:5000${artwork}`;
    console.log('Generated artwork URL:', url);
    return url;
  }
}

module.exports = new PlayerUIManager();