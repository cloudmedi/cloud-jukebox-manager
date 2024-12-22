const { Howl } = require('howler');
const QueueManager = require('./audio/QueueManager');
const PlaybackState = require('./audio/PlaybackState');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.currentSound = null;
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
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

  loadCurrentSong() {
    const song = this.queueManager.getCurrentSong();
    if (!song) {
      console.log('No song to load');
      return;
    }

    console.log('Loading song:', song);

    if (this.currentSound) {
      try {
        this.currentSound.stop();
        this.currentSound.unload();
      } catch (error) {
        console.error('Error stopping current sound:', error);
      }
      this.currentSound = null;
    }

    if (!song.localPath) {
      console.error('Song localPath is missing:', song);
      this.playNext();
      return;
    }

    const filePath = `file://${song.localPath.replace(/\\/g, '/')}`;
    console.log('Playing file from:', filePath);

    try {
      this.currentSound = new Howl({
        src: [filePath],
        html5: true,
        format: ['mp3'],
        volume: this.volume,
        xhr: {
          method: 'GET',
          headers: {
            'Origin': 'electron://cloud-media-player'
          }
        },
        onload: () => {
          console.log('Song loaded successfully:', song.name);
          if (this.isPlaying) {
            this.currentSound.play();
          }
        },
        onloaderror: (id, error) => {
          console.error('Song loading error:', error);
          console.error('Song path:', filePath);
          this.currentSound = null;
          this.playNext();
        },
        onplay: () => {
          console.log('Song started playing:', song.name);
          this.isPlaying = true;
          this.updatePlaybackState('playing');
        },
        onend: () => {
          console.log('Song ended, playing next');
          this.playNext();
        },
        onpause: () => {
          this.isPlaying = false;
          this.updatePlaybackState('paused');
        },
        onstop: () => {
          this.isPlaying = false;
          this.updatePlaybackState('stopped');
        }
      });
    } catch (error) {
      console.error('Error creating Howl instance:', error);
      this.currentSound = null;
      this.playNext();
    }
  }

  play() {
    console.log('Play requested');
    if (this.currentSound) {
      this.currentSound.play();
      this.isPlaying = true;
    } else {
      console.log('No sound loaded to play');
      this.loadCurrentSong();
    }
  }

  pause() {
    if (this.currentSound) {
      this.currentSound.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.currentSound) {
      this.currentSound.stop();
      this.isPlaying = false;
    }
  }

  playNext() {
    const nextSong = this.queueManager.next();
    if (nextSong) {
      this.loadCurrentSong();
    }
  }

  playPrevious() {
    const prevSong = this.queueManager.previous();
    if (prevSong) {
      this.loadCurrentSong();
    }
  }

  setVolume(volume) {
    this.volume = volume / 100;
    if (this.currentSound) {
      this.currentSound.volume(this.volume);
    }
  }

  shuffle() {
    this.queueManager.shuffle();
    this.loadCurrentSong();
  }

  updatePlaybackState(state) {
    this.playbackState.update(
      state,
      this.queueManager.getCurrentSong(),
      this.playlist,
      this.volume * 100
    );
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
      this.loadPlaylist(state.playlist);
      this.setVolume(state.volume);
      if (state.state === 'playing') {
        this.play();
      }
    }
  }
}

module.exports = new AudioPlayer();