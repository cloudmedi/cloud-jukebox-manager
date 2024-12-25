const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const CrossfadeManager = require('./CrossfadeManager');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.crossfadeManager = CrossfadeManager;
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    this.setupEventListeners();
    this.restoreState();
  }

  setupEventListeners() {
    // Event listener setup
  }

  loadPlaylist(playlist) {
    console.log('Loading playlist:', playlist);
    this.playlist = playlist;
    this.queueManager.setQueue(playlist.songs);
    
    if (this.queueManager.getCurrentSong()) {
      this.loadCurrentSong();
    } else {
      console.log('No playable songs in playlist');
    }
  }

  async loadCurrentSong() {
    const song = this.queueManager.getCurrentSong();
    if (!song) {
      console.log('No song to load');
      return;
    }

    console.log('Loading song:', song);

    if (!song.localPath) {
      console.error('Song localPath is missing:', song);
      this.playNext();
      return;
    }

    try {
      const success = await this.crossfadeManager.loadAndPlay(song.localPath);
      if (!success) {
        console.error('Failed to load song:', song.name);
        this.playNext();
      }
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
  }

  play() {
    console.log('Play requested');
    this.isPlaying = true;
    this.loadCurrentSong();
  }

  pause() {
    this.crossfadeManager.pause();
    this.isPlaying = false;
  }

  stop() {
    this.crossfadeManager.stop();
    this.isPlaying = false;
  }

  playNext() {
    console.log('Playing next song');
    const nextSong = this.queueManager.next();
    if (nextSong) {
      console.log('Next song found:', nextSong.name);
      this.loadCurrentSong();
    } else {
      console.log('No more songs in queue');
      this.stop();
    }
  }

  playPrevious() {
    console.log('Playing previous song');
    const prevSong = this.queueManager.previous();
    if (prevSong) {
      console.log('Previous song found:', prevSong.name);
      this.loadCurrentSong();
    }
  }

  setVolume(volume) {
    this.volume = volume / 100;
    this.crossfadeManager.setVolume(volume);
  }

  getCurrentState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: this.queueManager.getCurrentSong(),
      playlist: this.playlist,
      volume: this.volume * 100
    };
  }

  restoreState() {
    const state = this.playbackState.restore();
    if (state && state.playlist) {
      console.log('Restoring previous state:', state);
      this.loadPlaylist(state.playlist);
      this.setVolume(state.volume);
      
      if (state.state === 'playing') {
        setTimeout(() => {
          console.log('Auto-playing restored playlist');
          this.play();
        }, 1000);
      }
    }
  }
}

module.exports = new AudioPlayer();