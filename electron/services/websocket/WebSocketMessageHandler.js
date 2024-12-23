const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const playlistManager = require('../playlist/PlaylistManager');

class WebSocketMessageHandler {
  handleMessage(message) {
    console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'command':
        this.handleCommand(message);
        break;
      case 'playlist':
        this.handlePlaylist(message);
        break;
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  handleCommand(message) {
    console.log('Handling command:', message);

    switch (message.command) {
      case 'clearPlaylists':
        this.handleClearPlaylists();
        break;
      case 'setVolume':
        this.handleSetVolume(message.volume);
        break;
      case 'play':
      case 'pause':
        this.handlePlayPause(message.command);
        break;
      default:
        console.log('Unknown command:', message.command);
    }
  }

  handleClearPlaylists() {
    console.log('Clearing all playlists...');
    
    // Tüm playlistleri temizle
    playlistManager.clearPlaylists();
    store.delete('playlists');
    
    // Renderer process'e bildir
    ipcRenderer.send('playlists-cleared');
    
    // Token'ı göster
    const deviceInfo = store.get('deviceInfo');
    if (deviceInfo?.token) {
      console.log('Current device token:', deviceInfo.token);
      this.displayDeviceInfo(deviceInfo);
    }
  }

  displayDeviceInfo(deviceInfo) {
    const playlistContainer = document.getElementById('playlistContainer');
    if (playlistContainer) {
      playlistContainer.innerHTML = `
        <div class="device-info p-4 bg-gray-100 rounded-lg">
          <h2 class="text-lg font-semibold mb-2">Cihaz Bilgileri</h2>
          <p class="text-sm">Token: ${deviceInfo.token}</p>
        </div>
      `;
    }
  }

  handleSetVolume(volume) {
    console.log('Setting volume:', volume);
    ipcRenderer.send('set-volume', volume);
  }

  handlePlayPause(command) {
    console.log('Play/Pause command:', command);
    ipcRenderer.send('toggle-playback');
  }

  handlePlaylist(message) {
    if (!message.data) {
      console.error('Invalid playlist message:', message);
      return;
    }

    const playlist = message.data;
    console.log('Received playlist:', playlist.name);

    const playlists = playlistManager.getPlaylists();
    const existingIndex = playlists.findIndex(p => p._id === playlist._id);

    if (existingIndex !== -1) {
      playlists[existingIndex] = playlist;
    } else {
      playlists.push(playlist);
    }

    playlistManager.store.set('playlists', playlists);
    console.log('Playlist saved to store');

    // Notify renderer about new playlist
    ipcRenderer.send('playlist-updated', playlist);
  }
}

module.exports = new WebSocketMessageHandler();