const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class AudioUpdateHandler {
  constructor(audioElement) {
    this.audio = audioElement;
    this.setupEventListeners();
  }

  setupEventListeners() {
    ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
      console.log('Updating player with song:', currentSong);
      this.updateCurrentSong(currentSong);
      this.updatePlaylistDisplay(playlist);
    });
  }

  updateCurrentSong(currentSong) {
    if (currentSong && currentSong.localPath) {
      const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
      this.audio.src = normalizedPath;
      this.audio.play().catch(err => console.error('Playback error:', err));
    }
  }

  updatePlaylistDisplay(playlist) {
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) return;

    playlistContainer.innerHTML = '';
    
    if (playlist) {
      const artworkUrl = playlist.artwork 
        ? `http://localhost:5000${playlist.artwork}` 
        : null;

      const playlistElement = document.createElement('div');
      playlistElement.className = 'playlist-item';
      
      playlistElement.innerHTML = `
        <div class="playlist-info">
          ${artworkUrl ? 
            `<img src="${artworkUrl}" alt="${playlist.name}" class="playlist-artwork" onerror="this.onerror=null; this.src='placeholder.png'"/>` :
            '<div class="playlist-artwork-placeholder"></div>'
          }
          <div class="playlist-details">
            <h3>${playlist.name}</h3>
            <div class="song-info">
              <p class="artist">${playlist.songs[0]?.artist || 'Unknown Artist'}</p>
              <p class="song-name">${playlist.songs[0]?.name || 'No songs'}</p>
            </div>
          </div>
        </div>
      `;
      
      playlistContainer.appendChild(playlistElement);
    }
  }
}

module.exports = AudioUpdateHandler;