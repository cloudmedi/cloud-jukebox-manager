const websocketService = require('../websocketService');

class PlaybackManager {
  constructor() {
    this.isPlaying = false;
  }

  sendPlaybackStatus(status) {
    websocketService.sendMessage({
      type: 'playbackStatus',
      status: status
    });
  }

  handlePlay() {
    console.log('Play command received, current state:', this.isPlaying);
    if (!this.isPlaying) {
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('toggle-playback');
        this.isPlaying = true;
        this.sendPlaybackStatus('playing');
      }
    } else {
      console.log('Already playing, ignoring play command');
      this.sendPlaybackStatus('playing');
    }
  }

  handlePause() {
    console.log('Pause command received, current state:', this.isPlaying);
    if (this.isPlaying) {
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('toggle-playback');
        this.isPlaying = false;
        this.sendPlaybackStatus('paused');
      }
    } else {
      console.log('Already paused, ignoring pause command');
      this.sendPlaybackStatus('paused');
    }
  }
}

module.exports = new PlaybackManager();