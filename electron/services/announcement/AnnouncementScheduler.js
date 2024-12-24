const { app } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

class AnnouncementScheduler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.lastPlayTimes = new Map(); // anons id -> son çalma zamanı
    this.checkInterval = null;
  }

  initialize() {
    // Her dakika kontrol et
    this.checkInterval = setInterval(() => {
      this.checkAnnouncements();
    }, 60000);
  }

  checkAnnouncements() {
    const announcements = this.store.get('announcements', []);
    const now = new Date();

    announcements.forEach(announcement => {
      // Süresi geçen anonsları temizle
      if (new Date(announcement.endDate) < now) {
        this.removeAnnouncement(announcement._id);
        return;
      }

      // Başlangıç tarihi gelmemiş olanları atla
      if (new Date(announcement.startDate) > now) {
        return;
      }

      // Zamanlama tipine göre kontrol et
      switch (announcement.scheduleType) {
        case 'minutes':
          this.checkMinuteSchedule(announcement);
          break;
        case 'specific':
          this.checkSpecificTimeSchedule(announcement);
          break;
        // songs için ayrı bir mekanizma var
      }
    });
  }

  checkMinuteSchedule(announcement) {
    const lastPlayTime = this.lastPlayTimes.get(announcement._id) || 0;
    const now = Date.now();
    const minutesPassed = (now - lastPlayTime) / (1000 * 60);

    if (minutesPassed >= announcement.minuteInterval) {
      this.playAnnouncement(announcement);
    }
  }

  checkSpecificTimeSchedule(announcement) {
    const now = new Date();
    const currentTime = `${now.getHours()}:${now.getMinutes()}`;

    if (announcement.specificTimes.includes(currentTime)) {
      this.playAnnouncement(announcement);
    }
  }

  onSongEnd() {
    this.songCounter++;
    const announcements = this.store.get('announcements', []);
    
    announcements.forEach(announcement => {
      if (announcement.scheduleType === 'songs' && 
          this.songCounter % announcement.songInterval === 0) {
        this.playAnnouncement(announcement);
      }
    });
  }

  async playAnnouncement(announcement) {
    if (!this.isAnnouncementValid(announcement)) {
      return;
    }

    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    // Anonsu çal
    mainWindow.webContents.send('play-announcement', announcement);
    
    // Son çalma zamanını güncelle
    this.lastPlayTimes.set(announcement._id, Date.now());
  }

  isAnnouncementValid(announcement) {
    const now = new Date();
    const startDate = new Date(announcement.startDate);
    const endDate = new Date(announcement.endDate);

    return now >= startDate && now <= endDate;
  }

  removeAnnouncement(announcementId) {
    const announcements = this.store.get('announcements', []);
    const announcement = announcements.find(a => a._id === announcementId);
    
    if (announcement && announcement.localPath) {
      try {
        fs.unlinkSync(announcement.localPath);
      } catch (error) {
        console.error('Error deleting announcement file:', error);
      }
    }

    const updatedAnnouncements = announcements.filter(a => a._id !== announcementId);
    this.store.set('announcements', updatedAnnouncements);
    this.lastPlayTimes.delete(announcementId);
  }

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

module.exports = new AnnouncementScheduler();