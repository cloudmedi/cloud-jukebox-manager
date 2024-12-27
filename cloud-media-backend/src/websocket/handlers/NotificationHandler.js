const Notification = require('../../models/Notification');

class NotificationHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleNewNotification(notification) {
    // Tüm admin clientlara bildirim gönder
    this.wss.broadcastToAdmins({
      type: 'notification',
      subType: 'newNotification',
      notification
    });
  }

  async handleMarkAllRead() {
    // Tüm bildirimleri okundu olarak işaretle
    await Notification.updateMany(
      { read: false },
      { $set: { read: true } }
    );

    // Admin clientlara güncellemeyi bildir
    this.wss.broadcastToAdmins({
      type: 'notification',
      subType: 'notificationRead'
    });
  }
}

module.exports = NotificationHandler;