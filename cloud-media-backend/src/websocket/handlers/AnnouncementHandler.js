const Announcement = require('../../models/Announcement');

class AnnouncementHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleSongBasedAnnouncements(deviceId, songCount) {
    try {
      // Her X şarkıda bir çalacak anonsları kontrol et
      const announcements = await Announcement.find({
        status: 'active',
        scheduleType: 'songs',
        songInterval: { $exists: true, $ne: null }
      });

      for (const announcement of announcements) {
        if (songCount % announcement.songInterval === 0) {
          // Sıradaki anonsu al ve çal
          const nextAnnouncement = await Announcement.getNextAnnouncement(deviceId, 'songs');
          if (nextAnnouncement) {
            this.wss.sendToDevice(deviceId, {
              type: 'playAnnouncement',
              announcement: nextAnnouncement
            });
            break; // Bir anons çaldıktan sonra döngüden çık
          }
        }
      }
    } catch (error) {
      console.error('Song based announcement error:', error);
    }
  }

  async handleMinuteBasedAnnouncements(deviceId) {
    try {
      const now = new Date();
      const announcements = await Announcement.find({
        status: 'active',
        scheduleType: 'minutes',
        minuteInterval: { $exists: true, $ne: null }
      });

      for (const announcement of announcements) {
        const lastPlayed = announcement.lastPlayedAt || announcement.createdAt;
        const minutesSinceLastPlay = (now - lastPlayed) / (1000 * 60);

        if (minutesSinceLastPlay >= announcement.minuteInterval) {
          // Sıradaki anonsu al ve çal
          const nextAnnouncement = await Announcement.getNextAnnouncement(deviceId, 'minutes');
          if (nextAnnouncement) {
            this.wss.sendToDevice(deviceId, {
              type: 'playAnnouncement',
              announcement: nextAnnouncement
            });
            break; // Bir anons çaldıktan sonra döngüden çık
          }
        }
      }
    } catch (error) {
      console.error('Minute based announcement error:', error);
    }
  }
}

module.exports = AnnouncementHandler;