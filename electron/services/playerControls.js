const { ipcMain, globalShortcut } = require('electron');
const audioPlayer = require('./audioPlayer').getInstance();

class PlayerControls {
  constructor() {
    this.registerKeyboardShortcuts();
    this.setupAudioTransitions();
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

    audioPlayer.audio.addEventListener('ended', () => {
      this.fadeOut(() => {
        audioPlayer.playNext();
        this.fadeIn();
      });
    });
  }

  fadeOut(callback) {
    const audio = audioPlayer.audio;
    const fadePoint = audio.volume;
    const fadeAudio = setInterval(() => {
      if (audio.volume > 0.1) {
        audio.volume -= 0.1;
      } else {
        clearInterval(fadeAudio);
        audio.volume = 0;
        if (callback) callback();
      }
    }, 50);
  }

  fadeIn() {
    const audio = audioPlayer.audio;
    audio.volume = 0;
    const fadeAudio = setInterval(() => {
      if (audio.volume < 0.9) {
        audio.volume += 0.1;
      } else {
        clearInterval(fadeAudio);
        audio.volume = 1;
      }
    }, 50);
  }
}

module.exports = new PlayerControls();
