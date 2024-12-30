class PlaylistEventHandler {
  constructor(playlistAudio, onSongEnd) {
    this.playlistAudio = playlistAudio;
    this.onSongEnd = onSongEnd;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.playlistAudio.addEventListener('ended', () => {
      console.log('Playlist song ended');
      if (this.onSongEnd) {
        this.onSongEnd();
      }
    });

    this.playlistAudio.addEventListener('loadeddata', () => {
      console.log('Audio data loaded successfully');
    });

    this.playlistAudio.addEventListener('error', (error) => {
      console.error('Playlist playback error:', error);
    });
  }

  async playSong(songPath) {
    if (!songPath) {
      console.error('No song path provided');
      return false;
    }

    try {
      console.log('Playing song:', songPath);
      this.playlistAudio.src = songPath;
      await this.playlistAudio.play();
      return true;
    } catch (err) {
      console.error('Playlist playback error:', err);
      return false;
    }
  }
}

module.exports = PlaylistEventHandler;