const { ipcMain, globalShortcut, app } = require('electron');
const audioPlayer = require('./audioPlayer').getInstance();

class PlayerControls {
  constructor() {
    this.setupAudioTransitions();
    
    // Only register shortcuts if app is ready, otherwise wait
    if (app.isReady()) {
      this.registerKeyboardShortcuts();
    } else {
      app.whenReady().then(() => {
        this.registerKeyboardShortcuts();
      });
    }
  }

  registerKeyboardShortcuts() {
    globalShortcut.register('Space', () => {
      audioPlayer.togglePlayback();
    });

    globalShortcut.register('Right', () => {
      audioPlayer.playNext();
    });

    globalShortcut.register('Left', () => {
      audioPlayer.playPrevious();
    });
  }

  setupAudioTransitions() {
    const fadeOutDuration = 500; // ms
    const fadeInDuration = 500; // ms

    // Wait for audio player to be ready
    if (!audioPlayer.window) {
      app.whenReady().then(() => {
        this.setupAudioTransitions();
      });
      return;
    }

    // Send message to renderer to set up audio transitions
    audioPlayer.window.webContents.send('setup-transitions', {
      fadeOutDuration,
      fadeInDuration
    });

    // Listen for transition events from renderer
    ipcMain.on('transition-complete', () => {
      console.log('Audio transition completed');
    });
  }

  fadeOut(callback) {
    if (audioPlayer.window) {
      audioPlayer.window.webContents.send('fade-out');
      if (callback) {
        ipcMain.once('fade-out-complete', callback);
      }
    }
  }

  fadeIn() {
    if (audioPlayer.window) {
      audioPlayer.window.webContents.send('fade-in');
    }
  }
}

module.exports = new PlayerControls();