const { app } = require('electron');

class NotificationService {
  constructor() {
    this.appName = 'Cloud Media';
  }

  showNotification(title, body) {
    return new Notification(this.appName, {
      body: body
    });
  }

  showPlaylistNotification(playlist) {
    return this.showNotification('Yeni Playlist', 
      `${playlist.name} playlist'i başarıyla indirildi.`
    );
  }

  showErrorNotification(message) {
    return this.showNotification('Hata', message);
  }

  showSuccessNotification(message) {
    return this.showNotification('Başarılı', message);
  }

  showLoadingNotification(message) {
    return this.showNotification('İşlem Devam Ediyor', message);
  }
}

module.exports = new NotificationService();