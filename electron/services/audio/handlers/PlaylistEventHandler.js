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

    this.playlistAudio.addEventListener('play', () => {
      console.log('Playlist started playing');
      require('electron').ipcRenderer.send('playback-status-changed', true);
    });

    this.playlistAudio.addEventListener('pause', () => {
      console.log('Playlist paused');
      require('electron').ipcRenderer.send('playback-status-changed', false);
    });
  }

  async playSong(songPath) {
    if (!songPath) {
      console.error('No song path provided');
      return false;
    }

    try {
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