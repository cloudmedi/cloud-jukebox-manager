const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const PlaylistHandler = require('../playlist/PlaylistHandler');
const playlistManager = require('../playlist/PlaylistManager');

class WebSocketMessageHandler {
  constructor() {
    this.playlistHandler = new PlaylistHandler();
  }

  async handleMessage(message) {
    console.log('Handling WebSocket message:', message);

    switch (message.type) {
      case 'command':
        this.handleCommand(message);
        break;
      case 'playlist':
        await this.handlePlaylist(message);
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

  async handlePlaylist(message) {
    try {
      console.log('Playlist message received:', message);
      
      if (!message.data) {
        console.error('Invalid playlist message:', message);
        return;
      }

      const playlist = message.data;
      console.log('Processing playlist:', playlist.name);

      // PlaylistHandler'ı kullanarak playlist'i işle
      const updatedPlaylist = await this.playlistHandler.handlePlaylist(playlist);
      
      // Playlist'i kaydet ve renderer'a bildir
      playlistManager.savePlaylist(updatedPlaylist);
      ipcRenderer.send('playlist-updated', updatedPlaylist);
      
    } catch (error) {
      console.error('Error handling playlist message:', error);
    }
  }

  handleClearPlaylists() {
    console.log('Clearing all playlists...');
    playlistManager.clearPlaylists();
    store.delete('playlists');
    ipcRenderer.send('playlists-cleared');
  }

  handleSetVolume(volume) {
    console.log('Setting volume:', volume);
    ipcRenderer.send('set-volume', volume);
  }

  handlePlayPause(command) {
    console.log('Play/Pause command:', command);
    ipcRenderer.send('toggle-playback');
  }
}

module.exports = WebSocketMessageHandler;