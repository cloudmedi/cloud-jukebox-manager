const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { downloadFile } = require('../downloadUtils');

class AnnouncementHandler {
  constructor() {
    this.store = new Store();
    this.downloadPath = path.join(app.getPath('userData'), 'announcements');
    this.ensureDownloadDirectory();
  }

  ensureDownloadDirectory() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  async handleAnnouncement(announcement) {
    try {
      console.log('Handling announcement:', announcement);
      
      // Anons için yerel dosya yolu oluştur
      const fileName = path.basename(announcement.audioFile);
      const announcementDir = path.join(this.downloadPath, announcement._id);
      
      // Anons klasörünü oluştur
      if (!fs.existsSync(announcementDir)) {
        fs.mkdirSync(announcementDir, { recursive: true });
      }
      
      const localPath = path.join(announcementDir, fileName);

      // Ses dosyasını indir
      const audioUrl = `http://localhost:5000/${announcement.audioFile}`;
      await downloadFile(audioUrl, localPath, (progress) => {
        console.log(`Announcement download progress: ${progress}%`);
      });

      // Anonsu local path ile birlikte sakla
      const storedAnnouncement = {
        ...announcement,
        localPath,
        status: 'downloaded'
      };

      // Store'a kaydet
      this.store.set(`announcements.${announcement._id}`, storedAnnouncement);
      console.log('Announcement stored successfully:', storedAnnouncement);

      return storedAnnouncement;
    } catch (error) {
      console.error('Error handling announcement:', error);
      throw error;
    }
  }

  getStoredAnnouncement(id) {
    return this.store.get(`announcements.${id}`);
  }
}

module.exports = new AnnouncementHandler();