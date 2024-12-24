const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');
const { downloadFile } = require('../downloadUtils');
const store = new Store();

class AnnouncementHandler {
  constructor() {
    this.store = store;
    this.announcementsPath = path.join(app.getPath('userData'), 'announcements');
  }

  async handleAnnouncement(announcement) {
    try {
      // Anons ses dosyasının URL'ini oluştur
      const audioUrl = `http://localhost:5000/${announcement.audioFile}`;
      
      // Yerel dosya yolunu oluştur
      const localPath = path.join(
        this.announcementsPath,
        announcement._id,
        path.basename(announcement.audioFile)
      );

      // Dosyayı indir
      await downloadFile(audioUrl, localPath);

      // Anonsu yerel yol ile birlikte sakla
      const storedAnnouncement = {
        ...announcement,
        localPath,
        downloaded: true
      };

      // Store'a kaydet
      this.store.set(`announcements.${announcement._id}`, storedAnnouncement);

      return storedAnnouncement;
    } catch (error) {
      console.error('Anons indirme hatası:', error);
      throw error;
    }
  }

  getAnnouncement(id) {
    return this.store.get(`announcements.${id}`);
  }

  deleteAnnouncement(id) {
    this.store.delete(`announcements.${id}`);
  }
}

module.exports = new AnnouncementHandler();