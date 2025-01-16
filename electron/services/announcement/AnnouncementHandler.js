const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Store = require('electron-store');
const { Howl } = require('howler');
const { createLogger } = require('../../utils/logger');

const store = new Store();
const logger = createLogger('announcement-handler');

class AnnouncementHandler {
  constructor() {
    this.downloadPath = path.join(process.env.APPDATA, 'cloud-jukebox-manager', 'announcements');
    this.ensureDirectoryExists();
    this.howl = null;
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  async handleAnnouncement(announcement) {
    try {
      logger.info('Handling announcement:', announcement);
      
      // Anons dosyasını indir ve local path oluştur
      const localPath = await this.downloadAnnouncementFile(announcement);
      
      // Anons objesini güncelle ve kaydet
      const updatedAnnouncement = {
        ...announcement,
        localPath
      };
      
      // Local storage'a kaydet
      this.saveAnnouncement(updatedAnnouncement);

      // Howl ile çal
      if (this.howl) {
        this.howl.unload();
      }

      this.howl = new Howl({
        src: [localPath],
        html5: true,
        onend: () => {
          logger.info('Announcement finished');
          this.howl.unload();
        },
        onloaderror: () => {
          logger.error('Error loading announcement');
          this.howl.unload();
        },
        onplayerror: () => {
          logger.error('Error playing announcement');
          this.howl.unload();
        }
      });

      this.howl.play();
      
      return updatedAnnouncement;
    } catch (error) {
      logger.error('Error handling announcement:', error);
      throw error;
    }
  }

  async downloadAnnouncementFile(announcement) {
    const audioFile = announcement.audioFile.replace(/\\/g, '/');
    const fileName = path.basename(audioFile);
    const localPath = path.join(this.downloadPath, `${announcement._id}_${fileName}`);

    // Dosya zaten varsa tekrar indirme
    if (fs.existsSync(localPath)) {
      logger.info('Announcement file already exists:', localPath);
      return localPath;
    }

    try {
      const response = await axios({
        url: `http://localhost:5000/${audioFile}`,
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
      logger.error('Error downloading announcement file:', error);
      throw error;
    }
  }

  saveAnnouncement(announcement) {
    const announcements = store.get('announcements', []);
    const existingIndex = announcements.findIndex(a => a._id === announcement._id);
    
    if (existingIndex !== -1) {
      announcements[existingIndex] = announcement;
    } else {
      announcements.push(announcement);
    }
    
    store.set('announcements', announcements);
    logger.info('Announcement saved to store:', announcement);
  }

  stop() {
    if (this.howl) {
      this.howl.unload();
    }
  }
}

module.exports = new AnnouncementHandler();