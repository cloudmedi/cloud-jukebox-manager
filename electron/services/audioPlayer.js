const { BrowserWindow } = require('electron');
const QueueManager = require('./audio/QueueManager');
const PlaybackState = require('./audio/PlaybackState');
const path = require('path');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    // Create hidden window for audio playback
    this.window = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Load audio player HTML
    this.window.loadFile(path.join(__dirname, 'audio-player.html'));

    // Handle IPC messages from the audio player window
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
    this.queueManager.setQueue(playlist.songs);
    
    const firstSong = this.queueManager.getCurrentSong();
    if (firstSong) {
      this.loadSong(firstSong);
    } else {
      console.log('No playable songs in playlist');
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
    console.log('Play requested');
    this.window.webContents.send('play-audio');
    this.isPlaying = true;
  }

  pause() {
    this.window.webContents.send('pause-audio');
    this.isPlaying = false;
  }

  stop() {
    this.window.webContents.send('stop-audio');
    this.isPlaying = false;
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

  setVolume(volume) {
    this.volume = volume / 100;
    this.window.webContents.send('set-volume', this.volume);
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
}

module.exports = new AudioPlayer();