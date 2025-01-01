const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class UIManager {
  static updateConnectionStatus(isConnected) {
    const statusBadge = document.getElementById('connectionStatus');
    if (statusBadge) {
      statusBadge.className = `status-badge ${isConnected ? 'connected' : 'disconnected'}`;
    }
  }

  static showDownloadProgress(progress, songName) {
    const progressBar = document.getElementById('downloadProgress');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${songName}: ${progress}%`;
    }
  }

  static showError(message) {
    new Notification('Hata', {
      body: message
    });
  }

  static updatePlaybackBadge(state) {
    const playbackBadge = document.getElementById('playbackBadge');
    if (playbackBadge) {
      playbackBadge.className = 'status-badge';
      
      if (!store.get('playlists') || store.get('playlists').length === 0) {
        playbackBadge.classList.add('no-playlist');
        return;
      }

      playbackBadge.classList.add(state === 'playing' ? 'playing' : 'paused');
    }
  }
}

module.exports = UIManager;