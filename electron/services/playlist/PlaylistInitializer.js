const Store = require('electron-store');
const store = new Store();
const path = require('path');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('PlaylistInitializer');

class PlaylistInitializer {
  static initializePlaylist(playlist) {
    logger.info('Initializing playlist:', playlist.name);

    try {
      // Playlist'i store'a kaydet
      const playlists = store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = playlist;
      } else {
        playlists.push(playlist);
      }
      
      store.set('playlists', playlists);
      
      // Şarkı yollarını normalize et
      playlist.songs = playlist.songs.map(song => ({
        ...song,
        localPath: path.join(app.getPath('userData'), 'downloads', `${song._id}.mp3`)
      }));

      return { playlist, shouldAutoPlay: true };
    } catch (error) {
      logger.error('Error initializing playlist:', error);
      return null;
    }
  }
}

module.exports = PlaylistInitializer;