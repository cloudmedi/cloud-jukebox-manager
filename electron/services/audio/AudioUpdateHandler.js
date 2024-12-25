const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class AudioUpdateHandler {
  constructor(audioElement) {
    this.audio = audioElement;
    this.currentSong = null;
    this.nextSong = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    ipcRenderer.on('update-player', (event, { playlist, currentSong, isPlaying }) => {
      console.log('Received update-player event:', { playlist, currentSong, isPlaying });
      
      if (currentSong && currentSong !== this.currentSong) {
        console.log('Updating current song:', currentSong);
        this.currentSong = currentSong;
        
        // Sıradaki şarkıyı belirle
        const currentIndex = playlist.songs.findIndex(song => song._id === currentSong._id);
        this.nextSong = playlist.songs[(currentIndex + 1) % playlist.songs.length];
        
        this.updateCurrentSong(currentSong);
        this.updatePlaylistDisplay(playlist, currentSong, this.nextSong);

        // 3 saniye sonra yanıp sönme efekti
        setTimeout(() => {
          const nextSongElement = document.querySelector('.song-item.next');
          if (nextSongElement) {
            nextSongElement.style.animation = 'pulse 2s infinite';
          }
        }, 3000);
      }
    });

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

  updatePlaylistDisplay(playlist, currentSong, nextSong) {
    console.log('Updating playlist display with current song:', currentSong);
    const playlistContainer = document.getElementById('playlistContainer');
    if (!playlistContainer) {
      console.error('Playlist container not found');
      return;
    }

    // Mevcut içeriği temizle
    playlistContainer.innerHTML = '';
    
    // Çalan şarkı
    const currentSongElement = this.createSongElement(currentSong, playlist.artwork, 'current');
    playlistContainer.appendChild(currentSongElement);

    // Sıradaki şarkı
    if (nextSong) {
      const nextSongElement = this.createSongElement(nextSong, playlist.artwork, 'next');
      playlistContainer.appendChild(nextSongElement);
    }
  }

  createSongElement(song, playlistArtwork, className) {
    const element = document.createElement('div');
    element.className = `song-item ${className}`;
    
    const artworkUrl = playlistArtwork 
      ? `http://localhost:5000${playlistArtwork}` 
      : 'placeholder.png';

    element.innerHTML = `
      <img src="${artworkUrl}" alt="${song.name}" class="song-artwork" onerror="this.src='placeholder.png'"/>
      <div class="song-info">
        <div class="song-name">${song.name}</div>
        <div class="song-artist">${song.artist || 'Unknown Artist'}</div>
      </div>
    `;
    
    return element;
  }
}

module.exports = AudioUpdateHandler;