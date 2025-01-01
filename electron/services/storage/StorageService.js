const { ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();

class StorageService {
  constructor() {
    this.store = new Store();
    this.setupListeners();
  }

  setupListeners() {
    ipcMain.handle('store-song', async (event, { songId, songData }) => {
      return await this.storeSong(songId, songData);
    });

    ipcMain.handle('get-song', async (event, songId) => {
      return await this.getSong(songId);
    });
  }

  async storeSong(songId, songData) {
    try {
      console.log(`Storing song: ${songId}`);
      this.store.set(`songs.${songId}`, songData);
      return true;
    } catch (error) {
      console.error('Error storing song:', error);
      return false;
    }
  }

  async getSong(songId) {
    try {
      console.log(`Getting song: ${songId}`);
      return this.store.get(`songs.${songId}`);
    } catch (error) {
      console.error('Error getting song:', error);
      return null;
    }
  }

  async storePlaylist(playlist) {
    try {
      console.log(`Storing playlist: ${playlist._id}`);
      this.store.set(`playlists.${playlist._id}`, playlist);
      return true;
    } catch (error) {
      console.error('Error storing playlist:', error);
      return false;
    }
  }

  async getPlaylist(playlistId) {
    try {
      console.log(`Getting playlist: ${playlistId}`);
      return this.store.get(`playlists.${playlistId}`);
    } catch (error) {
      console.error('Error getting playlist:', error);
      return null;
    }
  }
}

module.exports = new StorageService();