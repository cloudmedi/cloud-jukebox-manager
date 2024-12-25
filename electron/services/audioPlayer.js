const { BrowserWindow, app } = require('electron');
const QueueManager = require('./audio/QueueManager');
const PlaybackState = require('./audio/PlaybackState');
const path = require('path');

class AudioPlayer {
  constructor() {
    this.playbackState = new PlaybackState();
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    this.window = null;
    
    // Initialize only if app is ready
    if (app.isReady()) {
      this.initializeWindow();
    } else {
      app.whenReady().then(() => {
        this.initializeWindow();
      });
    }
  }

  initializeWindow() {
    this.window = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.window.loadFile(path.join(__dirname, 'audio-player.html'));
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.window.webContents.on('ipc-message', (event, channel, ...args) => {
      switch (channel) {
        case 'audio-ended':
          console.log('Song ended, playing next');
          this.playNext();
          break;
        case 'audio-error':
          console.error('Audio error:', args[0]);
          this.playNext();
          break;
        case 'audio-playing':
          console.log('Audio started playing');
          this.isPlaying = true;
          this.updatePlaybackState('playing');
          break;
        case 'audio-paused':
          console.log('Audio paused');
          this.isPlaying = false;
          this.updatePlaybackState('paused');
          break;
      }
    });
  }

  loadPlaylist(playlist) {
    console.log('Loading playlist:', playlist);
    this.playlist = playlist;
    QueueManager.initializeQueue(playlist.songs);
    
    const firstSong = QueueManager.getCurrentSong();
    if (firstSong) {
      this.loadSong(firstSong);
    } else {
      console.log('No playable songs in playlist');
    }
  }

  loadSong(song) {
    if (!song || !this.window) {
      console.log('No song to load or window not ready');
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
      
      this.window.webContents.send('load-audio', {
        src: normalizedPath,
        volume: this.volume
      });
      
      if (this.isPlaying) {
        this.window.webContents.send('play-audio');
      }
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
  }

  play() {
    if (!this.window) return;
    
    console.log('Play requested');
    this.window.webContents.send('play-audio');
    this.isPlaying = true;
  }

  pause() {
    if (!this.window) return;
    
    this.window.webContents.send('pause-audio');
    this.isPlaying = false;
  }

  stop() {
    if (!this.window) return;
    
    this.window.webContents.send('stop-audio');
    this.isPlaying = false;
  }

  playNext() {
    console.log('Playing next song');
    const nextSong = QueueManager.getNextSong();
    if (nextSong) {
      console.log('Next song found:', nextSong.name);
      this.loadSong(nextSong);
    } else {
      console.log('No more songs in queue');
      this.stop();
    }
  }

  setVolume(volume) {
    if (!this.window) return;
    
    this.volume = volume / 100;
    this.window.webContents.send('set-volume', this.volume);
  }

  updatePlaybackState(state) {
    this.playbackState.update(
      state,
      QueueManager.getCurrentSong(),
      this.playlist,
      this.volume * 100
    );
  }

  getCurrentState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: QueueManager.getCurrentSong(),
      playlist: this.playlist,
      volume: this.volume * 100
    };
  }
}

// Create a single instance after export to ensure it's only created once
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new AudioPlayer();
    }
    return instance;
  }
};