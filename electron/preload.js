const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setNotificationTitle: (title) => {
    Notification.prototype.title = title;
  }
});