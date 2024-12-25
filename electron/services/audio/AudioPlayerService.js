const { ipcRenderer } = require('electron');
const UIManager = require('../ui/UIManager');

class AudioPlayerService {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.audio.addEventListener('timeupdate', () => {
            UIManager.updateProgress(this.audio.currentTime, this.audio.duration);
        });

        this.audio.addEventListener('ended', () => {
            console.log('Song ended, playing next');
            ipcRenderer.invoke('song-ended');
        });

        this.audio.addEventListener('play', () => {
            console.log('Audio started playing');
            ipcRenderer.send('playback-status-changed', true);
        });

        this.audio.addEventListener('pause', () => {
            console.log('Audio paused');
            ipcRenderer.send('playback-status-changed', false);
        });
    }

    setVolume(volume) {
        if (this.audio) {
            this.audio.volume = volume / 100;
        }
    }

    play() {
        if (this.audio) {
            return this.audio.play();
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
        }
    }

    updateSource(path) {
        if (this.audio) {
            this.audio.src = path;
        }
    }
}

module.exports = new AudioPlayerService();