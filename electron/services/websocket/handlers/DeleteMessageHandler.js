const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const store = new Store();

class DeleteMessageHandler {
  constructor() {
    this.store = new Store();
  }

  async handleMessage(message) {
    if (message.type !== 'delete') return;

    console.log('Processing delete message:', message);

    switch (message.action) {
      case 'started':
        await this.handleDeleteStarted(message);
        break;
      case 'success':
        await this.handleDeleteSuccess(message);
        break;
      case 'error':
        await this.handleDeleteError(message);
        break;
      default:
        console.warn('Unknown delete action:', message.action);
    }
  }

  async handleDeleteStarted(message) {
    console.log('Delete operation started:', message);
    if (message.entityType === 'playlist') {
      await this.handlePlaylistDelete(message.entityId);
    }
  }

  async handleDeleteSuccess(message) {
    console.log('Delete operation successful:', message);
    // Başarılı silme durumunda UI'ı güncelle
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('delete-success', message);
    }
  }

  async handleDeleteError(message) {
    console.error('Delete operation failed:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('delete-error', message);
    }
  }

  async handlePlaylistDelete(playlistId) {
    try {
      // Store'dan playlist'i bul
      const playlists = this.store.get('playlists', []);
      const playlist = playlists.find(p => p._id === playlistId);

      if (!playlist) {
        console.log('Playlist not found in store:', playlistId);
        return;
      }

      // Playlist'in şarkı dosyalarını sil
      for (const song of playlist.songs) {
        if (song.localPath && fs.existsSync(song.localPath)) {
          try {
            fs.unlinkSync(song.localPath);
            console.log('Deleted song file:', song.localPath);
          } catch (error) {
            console.error('Error deleting song file:', error);
          }
        }
      }

      // Playlist klasörünü sil
      const playlistDir = path.dirname(playlist.songs[0]?.localPath);
      if (playlistDir && fs.existsSync(playlistDir)) {
        try {
          fs.rmdirSync(playlistDir, { recursive: true });
          console.log('Deleted playlist directory:', playlistDir);
        } catch (error) {
          console.error('Error deleting playlist directory:', error);
        }
      }

      // Store'dan playlist'i kaldır
      const updatedPlaylists = playlists.filter(p => p._id !== playlistId);
      this.store.set('playlists', updatedPlaylists);
      console.log('Removed playlist from store:', playlistId);

      // UI'ı güncelle
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('playlist-deleted', playlistId);
      }

    } catch (error) {
      console.error('Error handling playlist delete:', error);
    }
  }
}

module.exports = new DeleteMessageHandler();