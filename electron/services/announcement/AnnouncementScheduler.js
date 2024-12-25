const SongBasedHandler = require('./handlers/SongBasedHandler');
const MinuteBasedHandler = require('./handlers/MinuteBasedHandler');
const SpecificTimeHandler = require('./handlers/SpecificTimeHandler');

class AnnouncementScheduler {
  constructor() {
    this.songHandler = SongBasedHandler;
    this.minuteHandler = MinuteBasedHandler;
    this.specificHandler = SpecificTimeHandler;
    this.checkInterval = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing AnnouncementScheduler');
    
    // Her dakika kontrol et
    this.checkInterval = setInterval(() => {
      console.log('Running scheduled checks...');
      this.minuteHandler.check();
      this.specificHandler.check();
    }, 60000);

    // Başlangıçta da bir kontrol yap
    this.minuteHandler.check();
    this.specificHandler.check();
    
    this.isInitialized = true;
    console.log('AnnouncementScheduler initialized');
  }

  async onSongEnd() {
    try {
      await this.songHandler.onSongEnd();
    } catch (error) {
      console.error('Error in onSongEnd:', error);
    }
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