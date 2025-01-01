const { ipcMain } = require('electron');
const EventEmitter = require('events');

class DownloadStateManager extends EventEmitter {
  constructor() {
    super();
    this.downloads = new Map();
    this.setupListeners();
  }

  setupListeners() {
    ipcMain.on('get-download-status', (event, songId) => {
      const status = this.getDownloadStatus(songId);
      event.reply('download-status-update', { songId, status });
    });
  }

  updateDownloadStatus(songId, status, progress = 0) {
    this.downloads.set(songId, { status, progress });
    this.emit('download-status-change', { songId, status, progress });
  }

  getDownloadStatus(songId) {
    return this.downloads.get(songId) || { status: 'pending', progress: 0 };
  }

  clearDownloadStatus(songId) {
    this.downloads.delete(songId);
  }
}

module.exports = new DownloadStateManager();