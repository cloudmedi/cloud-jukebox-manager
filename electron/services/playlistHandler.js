const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class PlaylistHandler {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    ipcRenderer.on('playlist-received', async (event, playlist) => {
      console.log('Playlist işleniyor:', playlist);
      
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
        
        // Playlist durumunu güncelle
        ipcRenderer.send('playlist-status-changed', {
          playlistId: playlist._id,
          status: 'loaded'
        });
        
        console.log('Playlist başarıyla kaydedildi');
      } catch (error) {
        console.error('Playlist işleme hatası:', error);
        ipcRenderer.send('playlist-status-changed', {
          playlistId: playlist._id,
          status: 'error'
        });
      }
    });
  }
}

module.exports = new PlaylistHandler();