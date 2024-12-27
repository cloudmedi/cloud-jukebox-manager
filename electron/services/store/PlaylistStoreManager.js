const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playlist-store-manager');

class PlaylistStoreManager {
  constructor() {
    this.store = new Store();
  }

  getPlaylists() {
    return this.store.get('playlists', []);
  }

  updatePlaylists(playlists) {
    this.store.set('playlists', playlists);
  }

  removeSongFromPlaylists(songId) {
    logger.info(`Removing song ${songId} from all playlists in store`);
    
    const playlists = this.getPlaylists();
    let updated = false;

    const updatedPlaylists = playlists.map(playlist => {
      const originalLength = playlist.songs.length;
      playlist.songs = playlist.songs.filter(song => song._id !== songId);
      
      if (playlist.songs.length !== originalLength) {
        updated = true;
        logger.info(`Removed song ${songId} from playlist ${playlist._id}`);
      }
      
      return playlist;
    });

    if (updated) {
      this.updatePlaylists(updatedPlaylists);
      logger.info('Store updated successfully');
    } else {
      logger.info('No playlists were modified');
    }

    return updated;
  }

  validatePlaylistData() {
    logger.info('Validating playlist data');
    const playlists = this.getPlaylists();
    let needsUpdate = false;

    const validatedPlaylists = playlists.map(playlist => {
      const validSongs = playlist.songs.filter(song => {
        if (!song.localPath) return true; // Henüz indirilmemiş şarkıları koru
        
        // Dosya var mı kontrol et
        const exists = fs.existsSync(song.localPath);
        if (!exists) {
          logger.info(`Invalid song found: ${song._id} - File doesn't exist at ${song.localPath}`);
          return false;
        }
        return true;
      });

      if (validSongs.length !== playlist.songs.length) {
        needsUpdate = true;
        logger.info(`Playlist ${playlist._id} updated: Removed ${playlist.songs.length - validSongs.length} invalid songs`);
      }

      return {
        ...playlist,
        songs: validSongs
      };
    });

    if (needsUpdate) {
      this.updatePlaylists(validatedPlaylists);
      logger.info('Store updated with validated playlist data');
    }

    return needsUpdate;
  }
}

module.exports = new PlaylistStoreManager();