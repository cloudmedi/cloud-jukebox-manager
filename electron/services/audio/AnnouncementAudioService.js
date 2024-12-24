const { ipcRenderer } = require('electron');
const AnnouncementLogger = require('../logging/AnnouncementLogger');
const AudioManager = require('./AudioManager');

class AnnouncementAudioService {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const audio = AudioManager.getPlaylistAudio();
    
    audio.addEventListener('loadeddata', () => {
      AnnouncementLogger.logAudioState(audio);
    });

    audio.addEventListener('error', (error) => {
      AnnouncementLogger.logError('Audio Playback', error);
    });
  }

  async playAnnouncement(announcement) {
    return AudioManager.playAnnouncement(announcement);
  }
}

module.exports = new AnnouncementAudioService();