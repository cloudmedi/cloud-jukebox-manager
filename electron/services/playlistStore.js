const Store = require('electron-store');

class PlaylistStore {
  constructor() {
    this.store = new Store();
  }

  getPlaylists() {
    return this.store.get('playlists', []);
  }

  getPlaylist(id) {
    const playlists = this.getPlaylists();
    return playlists.find(p => p._id === id);
  }

  savePlaylist(playlist) {
    const playlists = this.getPlaylists();
    const index = playlists.findIndex(p => p._id === playlist._id);
    
    if (index !== -1) {
      playlists[index] = playlist;
    } else {
      playlists.push(playlist);
    }
    
    this.store.set('playlists', playlists);
    return playlist;
  }

  deletePlaylist(id) {
    const playlists = this.getPlaylists();
    const filteredPlaylists = playlists.filter(p => p._id !== id);
    this.store.set('playlists', filteredPlaylists);
  }

  clearPlaylists() {
    this.store.delete('playlists');
  }
}

module.exports = new PlaylistStore();