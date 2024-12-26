const BaseDeleteHandler = require('./BaseDeleteHandler');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class AnnouncementDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('announcement');
    this.announcementPath = path.join(app.getPath('userData'), 'announcements');
  }

  async preDelete(id) {
    // Anonsun aktif olup olmadığını kontrol et
    const store = require('electron-store');
    const announcements = store.get('announcements', []);
    const announcement = announcements.find(a => a._id === id);
    
    if (!announcement) {
      throw new Error('Announcement not found');
    }
  }

  async executeDelete(id) {
    // Ses dosyasını sil
    const filePath = path.join(this.announcementPath, `${id}.mp3`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Store'dan kaldır
    const store = require('electron-store');
    const announcements = store.get('announcements', []);
    store.set('announcements', announcements.filter(a => a._id !== id));
  }

  async postDelete(id) {
    // Scheduler'ı güncelle
    global.announcementScheduler?.handleAnnouncementDeleted(id);
  }
}

module.exports = AnnouncementDeleteHandler;