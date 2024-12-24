const { ipcRenderer } = require('electron');
const AnnouncementLogger = require('../logging/AnnouncementLogger');

class AudioManager {
  constructor() {
    // Playlist için audio element
    this.playlistAudio = new Audio();
    this.playlistAudio.volume = 0.7;

    // Anons için ayrı audio element
    this.announcementAudio = new Audio();
    this.announcementAudio.volume = 1.0;

    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Anons audio event listeners
    this.announcementAudio.addEventListener('play', () => {
      AnnouncementLogger.logPlaybackStart();
      this.isAnnouncementPlaying = true;
    });

    this.announcementAudio.addEventListener('ended', () => {
      AnnouncementLogger.logPlaybackEnd();
      this.isAnnouncementPlaying = false;
      this.resumePlaylistIfNeeded();
    });

    this.announcementAudio.addEventListener('error', (error) => {
      AnnouncementLogger.logError('Anons Çalma', error);
      this.isAnnouncementPlaying = false;
      this.resumePlaylistIfNeeded();
    });

    // Playlist audio event listeners
    this.playlistAudio.addEventListener('ended', () => {
      if (!this.isAnnouncementPlaying) {
        console.log('Song ended, playing next');
        ipcRenderer.invoke('song-ended');
      }
    });
  }

  async playAnnouncement(announcement) {
    try {
      AnnouncementLogger.logAnnouncementRequest(announcement);
      
      if (!announcement.localPath) {
        throw new Error('Anons dosya yolu bulunamadı');
      }

      // Dosya kontrolü
      AnnouncementLogger.logFileCheck(announcement.localPath);

      // Mevcut playlist durumunu kaydet ve durdur
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      this.playlistAudio.pause();

      // Anons ses seviyesini ayarla
      AnnouncementLogger.logVolumeChange(this.announcementAudio.volume, 1.0);
      this.announcementAudio.volume = 1.0;

      // Anonsu çal
      this.announcementAudio.src = announcement.localPath;
      await this.announcementAudio.play();

      return true;
    } catch (error) {
      AnnouncementLogger.logError('Anons Çalma', error);
      this.resumePlaylistIfNeeded();
      return false;
    }
  }

  resumePlaylistIfNeeded() {
    if (this.wasPlaylistPlaying) {
      this.playlistAudio.play().catch(err => {
        console.error('Resume playback error:', err);
      });
      this.wasPlaylistPlaying = false;
    }
  }

  // Playlist kontrolleri
  playPlaylist(src) {
    if (!this.isAnnouncementPlaying) {
      this.playlistAudio.src = src;
      return this.playlistAudio.play();
    }
    return Promise.reject(new Error('Anons çalıyor'));
  }

  pausePlaylist() {
    this.playlistAudio.pause();
  }

  setPlaylistVolume(volume) {
    this.playlistAudio.volume = volume;
  }

  getPlaylistAudio() {
    return this.playlistAudio;
  }
}

module.exports = new AudioManager();