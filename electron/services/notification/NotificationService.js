const { app } = require('electron');

class NotificationService {
  constructor() {
    this.appName = 'Cloud Media';
  }

  showNotification(title, body) {
    return new Notification(title, {
      title: this.appName,
      body: body
    });
  }

  showPlaylistNotification(playlist) {
    return this.showNotification(this.appName, 
      `${playlist.name} playlist'i başarıyla indirildi.`
    );
  }

  showErrorNotification(message) {
    return this.showNotification(this.appName, message);
  }

  showSuccessNotification(message) {
    return this.showNotification(this.appName, message);
  }

  showLoadingNotification(message) {
    return this.showNotification(this.appName, message);
  }
}

module.exports = new NotificationService();