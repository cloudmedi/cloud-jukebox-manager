const Store = require('electron-store');
const store = new Store();

class AnnouncementScheduler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.currentSchedule = null;
    this.initialize();
  }

  initialize() {
    console.log('Initializing AnnouncementScheduler');
    this.loadSchedule();
  }

  loadSchedule() {
    const announcements = this.store.get('announcements', []);
    const activeAnnouncements = announcements.filter(announcement => 
      announcement.scheduleType === 'songs' &&
      new Date(announcement.startDate) <= new Date() &&
      new Date(announcement.endDate) >= new Date()
    );

    if (activeAnnouncements.length > 0) {
      this.currentSchedule = activeAnnouncements;
      console.log('Loaded active announcements:', this.currentSchedule);
    }
  }

  onSongEnd() {
    this.songCounter++;
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    console.log(`Şarkı sayacı: ${this.songCounter}`);
    
    if (!this.currentSchedule) {
      console.log('Aktif anons bulunamadı');
      return null;
    }

    // Her aktif anons için kontrol et
    for (const announcement of this.currentSchedule) {
      console.log(`\nAnons Kontrolü (${announcement._id}):`);
      console.log(`- Başlangıç: ${announcement.startDate}`);
      console.log(`- Bitiş: ${announcement.endDate}`);
      console.log(`- Şarkı aralığı: ${announcement.songInterval}`);
      console.log(`- Mevcut sayaç: ${this.songCounter}`);
      
      if (this.songCounter % announcement.songInterval === 0) {
        console.log('✓ Anons çalma koşulu sağlandı');
        return announcement;
      }
    }

    return null;
  }

  checkSchedule() {
    if (!this.currentSchedule || this.currentSchedule.length === 0) {
      return null;
    }

    // Her anons için kontrol et
    for (const announcement of this.currentSchedule) {
      if (this.songCounter % announcement.songInterval === 0) {
        return announcement;
      }
    }

    return null;
  }

  resetCounter() {
    this.songCounter = 0;
    console.log('Şarkı sayacı sıfırlandı');
  }

  cleanup() {
    this.currentSchedule = null;
    this.resetCounter();
  }
}

module.exports = new AnnouncementScheduler();