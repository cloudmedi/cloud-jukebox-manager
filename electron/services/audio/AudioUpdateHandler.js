const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class AudioUpdateHandler {
  constructor(audioElement) {
    this.audio = audioElement;
    this.currentSong = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    ipcRenderer.on('update-player', (event, { playlist, currentSong, isPlaying }) => {
      console.log('Received update-player event:', { playlist, currentSong, isPlaying });
      
      if (currentSong && currentSong !== this.currentSong) {
        console.log('Updating current song:', currentSong);
        this.currentSong = currentSong;
        this.updateCurrentSong(currentSong);
        this.updatePlaylistDisplay(playlist, currentSong);
      }
    });

    // Şarkı değişim eventi
    this.audio.addEventListener('ended', () => {
      console.log('Song ended, requesting next song');
      ipcRenderer.invoke('song-ended');
    });
  }

  updateCurrentSong(currentSong) {
    console.log('Updating audio source:', currentSong.localPath);
    if (currentSong && currentSong.localPath) {
      const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
      this.audio.src = normalizedPath;
      this.audio.play().catch(err => console.error('Playback error:', err));
    }
  }

  updatePlaylistDisplay(playlist, currentSong) {
    console.log('Updating playlist display with current song:', currentSong);
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) {
      console.error('Playlist container not found');
      return;
    }

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
              <p class="artist">${currentSong?.artist || 'Unknown Artist'}</p>
              <p class="song-name">${currentSong?.name || 'No songs'}</p>
            </div>
          </div>
        </div>
      `;
      
      playlistContainer.appendChild(playlistElement);
      console.log('Playlist display updated successfully');
    }
  }
}

module.exports = AudioUpdateHandler;