const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const PlaylistStoreManager = require('../../store/PlaylistStoreManager');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('song-delete-handler');

class SongDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('song');
    this.store = new Store();
  }

  async preDelete(id) {
    logger.info(`Starting pre-delete check for song: ${id}`);
    const playlists = PlaylistStoreManager.getPlaylists();
    let songFound = false;

    for (const playlist of playlists) {
      if (playlist.songs.some(song => song._id === id)) {
        songFound = true;
        break;
      }
    }

    if (!songFound) {
      logger.warn(`Song ${id} not found in any playlist`);
      throw new Error('Song not found in any playlist');
    }

    logger.info(`Pre-delete check completed for song: ${id}`);
  }

  async executeDelete(id) {
    logger.info(`Executing delete for song: ${id}`);
    
    // Önce dosyayı bul ve sil
    const playlists = PlaylistStoreManager.getPlaylists();
    let songToDelete = null;
    
    // Şarkıyı bul
    for (const playlist of playlists) {
      songToDelete = playlist.songs.find(s => s._id === id);
      if (songToDelete) break;
    }

    // Dosyayı sil
    if (songToDelete && songToDelete.localPath && fs.existsSync(songToDelete.localPath)) {
      try {
        fs.unlinkSync(songToDelete.localPath);
        logger.info(`Deleted song file: ${songToDelete.localPath}`);
      } catch (error) {
        logger.error(`Error deleting song file: ${error.message}`);
        throw error;
      }
    }

    // Store'dan sil
    const updated = PlaylistStoreManager.removeSongFromPlaylists(id);
    if (updated) {
      logger.info(`Song ${id} removed from store successfully`);
    } else {
      logger.warn(`No playlists were updated while removing song ${id}`);
    }
  }

  async postDelete(id) {
    logger.info(`Post-delete operations for song: ${id}`);
    
    // Store'u validate et
    PlaylistStoreManager.validatePlaylistData();
    
    // AudioService'i güncelle
    if (global.audioService) {
      global.audioService.handleSongDeleted(id);
      logger.info('AudioService updated');
    }

    logger.info(`Post-delete completed for song: ${id}`);
  }
}

module.exports = SongDeleteHandler;