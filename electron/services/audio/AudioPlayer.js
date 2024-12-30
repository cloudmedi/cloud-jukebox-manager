const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const path = require('path');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');
const Store = require('electron-store');
const { BrowserWindow } = require('electron');
const store = new Store();

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Event listeners will be handled through IPC in the renderer process
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.on('media-started-playing', () => {
        console.log('Audio started playing');
        this.isPlaying = true;
        this.updatePlaybackState('playing');
      });

      mainWindow.webContents.on('media-paused', () => {
        console.log('Audio paused');
        this.isPlaying = false;
        this.updatePlaybackState('paused');
      });
    }
  }

  play() {
    if (EmergencyStateManager.isEmergencyActive()) {
      console.log('Playback blocked: Emergency mode is active');
      return false;
    }

    console.log('Play requested');
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('audio-play');
      this.isPlaying = true;
    }
  }

  loadSong(song) {
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
      
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('load-audio', {
          path: normalizedPath,
          volume: this.volume,
          autoplay: this.isPlaying
        });
      }
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
  }

  playNext() {
    console.log('Playing next song');
    const nextSong = this.queueManager.next();
    if (nextSong) {
      console.log('Next song found:', nextSong.name);
      this.loadSong(nextSong);
    } else {
      console.log('No more songs in queue');
      this.stop();
    }
  }

  stop() {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('audio-stop');
    }
    this.isPlaying = false;
  }

  setVolume(volume) {
    console.log('AudioPlayer setVolume called:', { 
      rawVolume: volume,
      normalizedVolume: volume / 100 
    });
    
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    console.log('Volume normalized:', normalizedVolume);
    
    this.volume = normalizedVolume / 100;
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('set-volume', this.volume);
    }
    
    store.set('volume', normalizedVolume);
    console.log('Volume saved to store:', normalizedVolume);
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

  handleEmergencyStop() {
    const currentState = {
      wasPlaying: this.isPlaying,
      volume: this.volume,
    };
    store.set('playbackState', currentState);
    
    this.stop();
    this.setVolume(0);
  }

  handleEmergencyReset() {
    const savedState = store.get('playbackState');
    if (savedState) {
      this.volume = savedState.volume;
      this.setVolume(this.volume * 100);
      
      if (savedState.wasPlaying) {
        console.log('Restoring playback state after emergency');
        this.play();
      }
    }
  }
}

module.exports = new AudioPlayer();