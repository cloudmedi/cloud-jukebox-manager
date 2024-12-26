const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playlist-handler');

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async handlePlaylist(message) {
    try {
      logger.info('Handling playlist message:', message);

      // Önce message.data'nın var olduğunu kontrol et
      if (!message || !message.data) {
        throw new Error('Invalid message format: Missing data object');
      }

      // Playlist silme işlemi kontrolü
      if (message.action === 'deleted') {
        return this.handlePlaylistDeletion(message.data.playlistId);
      }

      // Playlist verisi message.data içinden al
      const playlist = message.data;
      
      // ID kontrolü - direkt data içinden
      if (!playlist._id) {
        logger.error('Playlist data error:', playlist);
        throw new Error('Invalid playlist data: Missing playlist ID in data object');
      }

      logger.info(`Processing playlist with ID: ${playlist._id}`);

      // Playlist için klasör oluştur
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // Şarkıları işle
      const updatedSongs = playlist.songs.map(song => ({
        ...song,
        localPath: path.join(playlistDir, `${song._id}.mp3`)
      }));

      // Güncellenmiş playlist'i oluştur
      const updatedPlaylist = {
        ...playlist,
        songs: updatedSongs
      };

      // Local storage'a kaydet
      const playlists = store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = updatedPlaylist;
      } else {
        playlists.push(updatedPlaylist);
      }
      
      store.set('playlists', playlists);
      logger.info(`Playlist ${playlist._id} processed successfully`);
      
      return updatedPlaylist;

    } catch (error) {
      logger.error('Error handling playlist:', error);
      throw error;
    }
  }

  handlePlaylistDeletion(playlistId) {
    try {
      logger.info(`Handling playlist deletion for ID: ${playlistId}`);

      // Local storage'dan playlist'i sil
      const playlists = store.get('playlists', []);
      const updatedPlaylists = playlists.filter(p => p._id !== playlistId);
      store.set('playlists', updatedPlaylists);

      // Playlist klasörünü sil
      const playlistDir = path.join(this.downloadPath, playlistId);
      if (fs.existsSync(playlistDir)) {
        fs.rmSync(playlistDir, { recursive: true, force: true });
        logger.info(`Deleted playlist directory: ${playlistDir}`);
      }

      logger.info('Playlist deletion completed successfully');
      return { success: true, message: 'Playlist deleted' };
    } catch (error) {
      logger.error('Error handling playlist deletion:', error);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();