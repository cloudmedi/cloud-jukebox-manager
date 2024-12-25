const { ipcRenderer } = require('electron');
const SongInfoUpdater = require('../ui/SongInfoUpdater');

class AudioEventManager {
  constructor(audioElement) {
    this.audio = audioElement;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Şarkı bittiğinde
    this.audio.addEventListener('ended', () => {
      console.log('Song ended, updating UI before next song');
      ipcRenderer.invoke('song-ended');
    });

    // Yeni şarkı yüklendiğinde
    this.audio.addEventListener('loadeddata', () => {
      console.log('New song loaded, updating UI');
      const currentSong = this.getCurrentSongInfo();
      if (currentSong) {
        SongInfoUpdater.updateSongInfo(currentSong);
      }
    });
  }

  getCurrentSongInfo() {
    // Mevcut şarkı bilgilerini store'dan veya başka bir kaynaktan al
    return this.audio.dataset.currentSong ? JSON.parse(this.audio.dataset.currentSong) : null;
  }

  updateCurrentSong(song) {
    console.log('Setting new current song:', song);
    this.audio.dataset.currentSong = JSON.stringify(song);
    SongInfoUpdater.updateSongInfo(song);
  }
}

module.exports = AudioEventManager;