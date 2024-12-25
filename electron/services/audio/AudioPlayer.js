const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const AudioFader = require('./AudioFader');
const path = require('path');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.playlist = null;

    // Dual audio elements for crossfading
    this.currentAudio = new Audio();
    this.nextAudio = new Audio();

    this.currentFader = new AudioFader();
    this.nextFader = new AudioFader();

    this.volume = 1.0;
    this.isPlaying = false;

    // Connect faders
    this.currentFader.connectSource(this.currentAudio);
    this.nextFader.connectSource(this.nextAudio);

    this.setupEventListeners();
    
    // Initialize volume
    this.setVolume(70); // 70% default volume
  }

  setupEventListeners() {
    this.currentAudio.addEventListener('ended', () => {
      console.log('Current song ended, playing next');
      this.playNext();
    });

    this.currentAudio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.playNext();
    });

    this.currentAudio.addEventListener('play', () => {
      console.log('Audio started playing');
      this.isPlaying = true;
      this.updatePlaybackState('playing');
    });

    this.currentAudio.addEventListener('pause', () => {
      console.log('Audio paused');
      this.isPlaying = false;
      this.updatePlaybackState('paused');
    });
  }

  async crossfade(nextSong, duration = 3) {
    if (!nextSong || !nextSong.localPath) {
      console.error('Next song localPath is missing:', nextSong);
      return;
    }

    try {
      const normalizedPath = path.normalize(nextSong.localPath);
      console.log('Crossfading to next song:', normalizedPath);

      // Prepare next song
      this.nextAudio.src = normalizedPath;
      this.nextAudio.volume = 0;
      this.nextFader.setVolume(0);
      await this.nextAudio.play();

      // Start crossfade
      await Promise.all([
        this.currentFader.fadeOut(duration),
        this.nextFader.fadeIn(duration)
      ]);

      // Switch audio elements after crossfade
      this.currentAudio.pause();
      this.currentAudio.src = '';
      
      // Swap current and next
      [this.currentAudio, this.nextAudio] = [this.nextAudio, this.currentAudio];
      [this.currentFader, this.nextFader] = [this.nextFader, this.currentFader];

      // Reset next audio
      this.nextAudio = new Audio();
      this.nextFader = new AudioFader();
      this.nextFader.connectSource(this.nextAudio);

      this.emitSongChange(nextSong);
      console.log('Crossfade completed successfully');
    } catch (error) {
      console.error('Error during crossfade:', error);
      this.playNext();
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
      const normalizedPath = path.normalize(song.localPath);
      console.log('Playing file from:', normalizedPath);

      // Fade out current audio if playing
      if (this.isPlaying) {
        await this.currentFader.fadeOut(2);
      }

      this.currentAudio.src = normalizedPath;
      this.currentAudio.volume = this.volume;

      if (this.isPlaying) {
        await this.currentAudio.play();
        await this.currentFader.fadeIn(2);
      }

      this.emitSongChange(song);
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
  }

  play() {
    console.log('Play requested');
    if (this.currentAudio.src) {
      this.currentAudio.play().catch(error => {
        console.error('Error playing audio:', error);
        this.playNext();
      });
      this.isPlaying = true;
    } else {
      console.log('No audio source loaded');
      this.loadCurrentSong();
    }
  }

  pause() {
    this.currentAudio.pause();
    this.isPlaying = false;
  }

  stop() {
    this.currentAudio.pause();
    this.currentAudio.currentTime = 0;
    this.isPlaying = false;
  }

  async playNext() {
    console.log('Playing next song');
    const nextSong = this.queueManager.next();
    if (nextSong) {
      await this.crossfade(nextSong, 3);
    } else {
      console.log('No more songs in queue');
      this.stop();
    }
  }

  playPrevious() {
    console.log('Playing previous song');
    const prevSong = this.queueManager.previous();
    if (prevSong) {
      this.crossfade(prevSong, 3);
    }
  }

  setVolume(volume) {
    this.volume = volume / 100;
    this.currentFader.setVolume(this.volume);
    this.nextFader.setVolume(this.volume);
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

  emitSongChange(song) {
    if (this.playlist) {
      require('electron').ipcRenderer.send('update-player', {
        playlist: this.playlist,
        currentSong: song,
        isPlaying: this.isPlaying
      });
    }
  }
}

module.exports = new AudioPlayer();