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
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing AnnouncementScheduler');
    
    // Her dakika kontrol et
    this.checkInterval = setInterval(() => {
      this.checkAnnouncements();
    }, 60000);

    // Başlangıçta da bir kontrol yap
    this.checkAnnouncements();
    
    this.isInitialized = true;
    console.log('AnnouncementScheduler initialized');
  }

  checkAnnouncements() {
    const announcements = this.store.get('announcements', []);
    const now = new Date();

    console.log(`Checking ${announcements.length} announcements`);

    announcements.forEach(announcement => {
      // Süresi geçen anonsları temizle
      if (new Date(announcement.endDate) < now) {
        console.log(`Announcement ${announcement._id} expired, removing`);
        this.removeAnnouncement(announcement._id);
        return;
      }

      // Başlangıç tarihi gelmemiş olanları atla
      if (new Date(announcement.startDate) > now) {
        console.log(`Announcement ${announcement._id} not started yet`);
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
        // songs için ayrı bir mekanizma var (onSongEnd)
      }
    });
  }

  checkMinuteSchedule(announcement) {
    const lastPlayTime = this.lastPlayTimes.get(announcement._id) || 0;
    const now = Date.now();
    const minutesPassed = (now - lastPlayTime) / (1000 * 60);

    console.log(`Minutes passed for ${announcement._id}: ${minutesPassed}`);

    if (minutesPassed >= announcement.minuteInterval) {
      console.log(`Playing minute-based announcement ${announcement._id}`);
      this.playAnnouncement(announcement);
    }
  }

  checkSpecificTimeSchedule(announcement) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (announcement.specificTimes.includes(currentTime)) {
      console.log(`Playing specific-time announcement ${announcement._id} at ${currentTime}`);
      this.playAnnouncement(announcement);
    }
  }

  onSongEnd() {
    this.songCounter++;
    console.log(`Song ended, counter: ${this.songCounter}`);
    
    const announcements = this.store.get('announcements', []);
    
    announcements.forEach(announcement => {
      if (announcement.scheduleType === 'songs' && 
          this.songCounter % announcement.songInterval === 0) {
        console.log(`Playing song-based announcement ${announcement._id}`);
        this.playAnnouncement(announcement);
      }
    });
  }

  async playAnnouncement(announcement) {
    if (!this.isAnnouncementValid(announcement)) {
      console.log(`Announcement ${announcement._id} is not valid for playback`);
      return;
    }

    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.log('Main window not found');
      return;
    }

    console.log(`Sending play-announcement command for ${announcement._id}`);
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
        console.log(`Deleted announcement file: ${announcement.localPath}`);
      } catch (error) {
        console.error('Error deleting announcement file:', error);
      }
    }

    const updatedAnnouncements = announcements.filter(a => a._id !== announcementId);
    this.store.set('announcements', updatedAnnouncements);
    this.lastPlayTimes.delete(announcementId);
    console.log(`Announcement ${announcementId} removed from store`);
  }

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isInitialized = false;
    console.log('AnnouncementScheduler cleaned up');
  }
}

module.exports = new AnnouncementScheduler();