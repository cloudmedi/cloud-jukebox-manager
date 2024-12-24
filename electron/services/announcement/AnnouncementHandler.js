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
      
      // Create directory for announcement
      const fileName = path.basename(announcement.audioFile);
      const announcementDir = path.join(this.downloadPath, announcement._id);
      
      if (!fs.existsSync(announcementDir)) {
        fs.mkdirSync(announcementDir, { recursive: true });
      }
      
      const localPath = path.join(announcementDir, fileName);

      // Download audio file
      const audioUrl = `http://localhost:5000/${announcement.audioFile}`;
      await downloadFile(audioUrl, localPath, (progress) => {
        console.log(`Announcement download progress: ${progress}%`);
      });

      // Store announcement with local path
      const storedAnnouncement = {
        ...announcement,
        localPath,
        status: 'downloaded'
      };

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