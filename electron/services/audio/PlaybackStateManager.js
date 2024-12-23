const Store = require('electron-store');
const store = new Store();

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying, playlistId = null) {
    const state = {
      isPlaying,
      playlistId,
      timestamp: new Date().toISOString()
    };
    
    // Playlist durumunu da güncelle
    if (playlistId) {
      const playlists = this.store.get('playlists', []);
      const updatedPlaylists = playlists.map(playlist => {
        if (playlist._id === playlistId) {
          return { ...playlist, isPlaying };
        }
        return playlist;
      });
      this.store.set('playlists', updatedPlaylists);
    }
    
    this.store.set('playbackState', state);
    console.log('Playback state saved:', state);
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    if (!state) return { isPlaying: false };

    // Playlist durumunu kontrol et
    const playlists = this.store.get('playlists', []);
    const activePlaylist = playlists.find(p => p._id === state.playlistId);
    
    // Eğer playlist varsa ve durumu farklıysa, playlist durumunu kullan
    if (activePlaylist && activePlaylist.isPlaying !== state.isPlaying) {
      this.savePlaybackState(activePlaylist.isPlaying, state.playlistId);
      return { isPlaying: activePlaylist.isPlaying, playlistId: state.playlistId };
    }

    return state;
  }

  clearPlaybackState() {
    this.store.delete('playbackState');
  }
}

module.exports = new PlaybackStateManager();