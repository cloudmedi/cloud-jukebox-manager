const playlistManager = require('../playlist/PlaylistManager');

class WebSocketMessageHandler {
  handleMessage(message) {
    if (!message || !message.type) {
      console.error('Invalid message format:', message);
      return;
    }

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
    switch (message.command) {
      case 'clearPlaylists':
        console.log('Clearing all playlists');
        playlistManager.clearPlaylists();
        break;
      case 'restart':
        console.log('Restarting application');
        require('electron').app.relaunch();
        require('electron').app.exit(0);
        break;
      case 'setVolume':
        console.log('Setting volume to:', message.volume);
        if (typeof message.volume === 'number' && message.volume >= 0 && message.volume <= 100) {
          const audio = document.getElementById('audioPlayer');
          if (audio) {
            audio.volume = message.volume / 100;
          }
        }
        break;
      case 'play':
        console.log('Playing audio');
        const audioPlay = document.getElementById('audioPlayer');
        if (audioPlay) {
          audioPlay.play().catch(err => console.error('Play error:', err));
        }
        break;
      case 'pause':
        console.log('Pausing audio');
        const audioPause = document.getElementById('audioPlayer');
        if (audioPause) {
          audioPause.pause();
        }
        break;
    }
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
    require('electron').ipcRenderer.send('playlist-updated', playlist);
  }
}

module.exports = new WebSocketMessageHandler();