const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { downloadFile } = require('../downloadUtils');

class AnnouncementHandler {
  constructor() {
    this.store = new Store();
    this.downloadPath = path.join(app.getPath('userData'), 'announcements');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  async handleAnnouncement(announcement) {
    try {
      console.log('Processing announcement:', announcement);
      
      // Anons için klasör oluştur
      const announcementDir = path.join(this.downloadPath, announcement._id);
      if (!fs.existsSync(announcementDir)) {
        fs.mkdirSync(announcementDir, { recursive: true });
      }

      // Ses dosyasını indir
      const audioFileName = path.basename(announcement.audioFile);
      const localPath = path.join(announcementDir, audioFileName);

      if (!fs.existsSync(localPath)) {
        const audioUrl = `http://localhost:5000/${announcement.audioFile}`;
        await downloadFile(audioUrl, localPath);
        console.log('Announcement audio downloaded:', localPath);
      }

      // Anons bilgilerini güncelle ve sakla
      const storedAnnouncement = {
        ...announcement,
        localPath,
        downloadedAt: new Date().toISOString()
      };

      // Store'a kaydet
      const announcements = this.store.get('announcements', {});
      announcements[announcement._id] = storedAnnouncement;
      this.store.set('announcements', announcements);

      console.log('Announcement stored:', storedAnnouncement);
      return storedAnnouncement;

    } catch (error) {
      console.error('Error handling announcement:', error);
      throw error;
    }
  }

  getStoredAnnouncement(id) {
    const announcements = this.store.get('announcements', {});
    return announcements[id];
  }

  getAllAnnouncements() {
    return this.store.get('announcements', {});
  }

  deleteAnnouncement(id) {
    const announcements = this.store.get('announcements', {});
    const announcement = announcements[id];

    if (announcement && announcement.localPath) {
      try {
        fs.unlinkSync(announcement.localPath);
        const announcementDir = path.dirname(announcement.localPath);
        fs.rmdirSync(announcementDir);
      } catch (error) {
        console.error('Error deleting announcement files:', error);
      }
    }

    delete announcements[id];
    this.store.set('announcements', announcements);
  }
}

module.exports = new AnnouncementHandler();