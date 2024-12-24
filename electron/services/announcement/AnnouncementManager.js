const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const axios = require('axios');
const AnnouncementScheduler = require('./AnnouncementScheduler');

class AnnouncementManager {
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

  async handleNewAnnouncement(announcement) {
    try {
      console.log('Processing new announcement:', announcement);

      // Dosyayı indir ve local path oluştur
      const localPath = await this.downloadAnnouncementFile(announcement);
      
      // Anons objesini güncelle
      const updatedAnnouncement = {
        ...announcement,
        localPath
      };

      // Store'a kaydet
      this.saveAnnouncement(updatedAnnouncement);

      return updatedAnnouncement;
    } catch (error) {
      console.error('Error handling announcement:', error);
      throw error;
    }
  }

  async downloadAnnouncementFile(announcement) {
    const fileName = path.basename(announcement.audioFile);
    const localPath = path.join(this.downloadPath, `${announcement._id}_${fileName}`);

    // Dosya zaten varsa tekrar indirme
    if (fs.existsSync(localPath)) {
      console.log('Announcement file already exists:', localPath);
      return localPath;
    }

    try {
      const response = await axios({
        url: `http://localhost:5000/${announcement.audioFile}`,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(localPath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading announcement file:', error);
      throw error;
    }
  }

  saveAnnouncement(announcement) {
    const announcements = this.store.get('announcements', []);
    const existingIndex = announcements.findIndex(a => a._id === announcement._id);
    
    if (existingIndex !== -1) {
      announcements[existingIndex] = announcement;
    } else {
      announcements.push(announcement);
    }
    
    this.store.set('announcements', announcements);
    console.log('Announcement saved to store:', announcement);
  }
}

module.exports = new AnnouncementManager();