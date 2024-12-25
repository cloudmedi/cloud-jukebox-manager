const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const AudioFader = require('./AudioFader');
const path = require('path');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.audio = new Audio();
    this.audioFader = new AudioFader();
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    // Connect audio element to Web Audio API
    this.audioFader.connectSource(this.audio);
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audio.addEventListener('ended', () => {
      console.log('Song ended, playing next');
      this.playNext();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.playNext();
    });

    this.audio.addEventListener('play', () => {
      console.log('Audio started playing');
      this.isPlaying = true;
      this.updatePlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio paused');
      this.isPlaying = false;
      this.updatePlaybackState('paused');
    });
  }

  async crossfade(nextSong, duration = 2) {
    if (!nextSong || !nextSong.localPath) {
      console.error('Next song localPath is missing:', nextSong);
      return;
    }

    try {
      const normalizedPath = path.normalize(nextSong.localPath);
      console.log('Crossfading to next song:', normalizedPath);

      // Yeni bir audio element oluştur ve yeni şarkıyı bağla
      const newAudio = new Audio(normalizedPath);
      const newAudioFader = new AudioFader();
      newAudioFader.connectSource(newAudio);

      // Yeni şarkıyı fade-in için hazırla
      newAudio.volume = 0;
      newAudioFader.setVolume(0);
      await newAudio.play();

      // Mevcut şarkıyı fade-out yaparken, yeni şarkıyı fade-in yap
      await Promise.all([
        this.audioFader.fadeOut(duration),
        newAudioFader.fadeIn(duration)
      ]);

      // Çapraz geçiş tamamlandıktan sonra eski şarkıyı değiştir
      this.audio.pause();
      this.audio.src = '';
      this.audio = newAudio;
      this.audioFader = newAudioFader;
      this.isPlaying = true;

      this.emitSongChange(nextSong);
    } catch (error) {
      console.error('Error during crossfade:', error);
      this.playNext();
    }
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
      
      await this.audioFader.fadeOut();
      
      this.audio.pause();
      this.audio.currentTime = 0;
      
      this.audio.src = normalizedPath;
      this.audio.volume = this.volume;
      
      if (this.isPlaying) {
        await this.audio.play();
        await this.audioFader.fadeIn();
      }
      
      this.emitSongChange(song);
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
  }

  play() {
    console.log('Play requested');
    if (this.audio.src) {
      this.audio.play().catch(error => {
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
    this.audio.pause();
    this.isPlaying = false;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
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
    this.audioFader.setVolume(this.volume);
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
