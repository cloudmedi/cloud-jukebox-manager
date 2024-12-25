const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class AudioUpdateHandler {
  constructor(audioElement) {
    this.audio = audioElement;
    this.currentSongInfo = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Player güncelleme eventi
    ipcRenderer.on('update-player', (event, { playlist, currentSong, isPlaying }) => {
      console.log('Updating player with song:', currentSong);
      this.updateCurrentSong(currentSong);
      this.updatePlaylistDisplay(playlist, currentSong);
    });

    // Şarkı değişim eventi
    this.audio.addEventListener('ended', () => {
      console.log('Song ended, requesting next song');
      ipcRenderer.invoke('song-ended');
    });
  }

  updateCurrentSong(currentSong) {
    if (!currentSong) {
      console.warn('No current song provided for update');
      return;
    }

    console.log('Updating current song:', currentSong);
    this.currentSongInfo = currentSong;

    if (currentSong.localPath) {
      const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
      this.audio.src = normalizedPath;
      
      // Şarkı meta verilerini güncelle
      this.updateSongMetadata(currentSong);
      
      this.audio.play().catch(err => {
        console.error('Playback error:', err);
        ipcRenderer.send('playback-error', { 
          songId: currentSong._id,
          error: err.message 
        });
      });
    }
  }

  updateSongMetadata(song) {
    // DOM elementlerini güncelle
    const songNameElement = document.querySelector('.song-name');
    const artistElement = document.querySelector('.artist');
    
    if (songNameElement) {
      songNameElement.textContent = song.name;
      console.log('Updated song name display:', song.name);
    }
    
    if (artistElement) {
      artistElement.textContent = song.artist;
      console.log('Updated artist display:', song.artist);
    }
  }

  updatePlaylistDisplay(playlist, currentSong) {
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) {
      console.error('Playlist container not found');
      return;
    }

    console.log('Updating playlist display with current song:', currentSong);
    
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