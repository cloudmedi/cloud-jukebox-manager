const Store = require('electron-store');
const store = new Store();

class PlaylistManager {
  constructor() {
    this.store = store;
  }

  clearPlaylists() {
    console.log('Clearing all playlists from store');
    store.delete('playlists');
    return true;
  }

  getPlaylists() {
    return store.get('playlists', []);
  }

  savePlaylist(playlist) {
    const playlists = this.getPlaylists();
    const existingIndex = playlists.findIndex(p => p._id === playlist._id);

    if (existingIndex !== -1) {
      playlists[existingIndex] = playlist;
    } else {
      playlists.push(playlist);
    }

    store.set('playlists', playlists);
    return playlist;
  }

  removePlaylist(playlistId) {
    const playlists = this.getPlaylists();
    const filteredPlaylists = playlists.filter(p => p._id !== playlistId);
    store.set('playlists', filteredPlaylists);
    return true;
  }

  getPlaylistById(playlistId) {
    const playlists = this.getPlaylists();
    return playlists.find(p => p._id === playlistId);
  }

  updatePlaylistStatus(playlistId, status) {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p._id === playlistId);
    
    if (playlist) {
      playlist.status = status;
      store.set('playlists', playlists);
      return playlist;
    }
    
    return null;
  }
}

module.exports = new PlaylistManager();