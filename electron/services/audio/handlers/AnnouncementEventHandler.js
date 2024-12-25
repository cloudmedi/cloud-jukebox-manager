const AnnouncementQueueManager = require('../../announcement/AnnouncementQueueManager');

class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya yüklendiğinde
    this.campaignAudio.addEventListener('loadeddata', () => {
      console.log('Announcement loaded');
    });

    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      console.log('Announcement started playing');
      this.isAnnouncementPlaying = true;
    });

    // Kampanya bittiğinde
    this.campaignAudio.addEventListener('ended', () => {
      console.log('Announcement ended');
      this.isAnnouncementPlaying = false;
      AnnouncementQueueManager.onAnnouncementEnd(this.playlistAudio);
    });

    // Kampanya hata durumunda
    this.campaignAudio.addEventListener('error', (error) => {
      console.error('Announcement playback error:', error);
      this.isAnnouncementPlaying = false;
      AnnouncementQueueManager.cleanup();
    });
  }

  async playAnnouncement(announcement, priority = 2) {
    if (!announcement?.localPath) {
      console.error('Invalid announcement or missing local path');
      return false;
    }

    try {
      // Anons kuyruğuna ekle
      const added = AnnouncementQueueManager.addAnnouncement(announcement, priority);
      if (!added) return false;

      // Kuyruğu işle
      await AnnouncementQueueManager.processQueue(this.playlistAudio, this.campaignAudio);
      return true;
    } catch (err) {
      console.error('Error playing announcement:', err);
      return false;
    }
  }

  isPlaying() {
    return this.isAnnouncementPlaying;
  }
}

module.exports = AnnouncementEventHandler;