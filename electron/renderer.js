const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const TokenDisplay = require('./services/ui/TokenDisplay');
const PlaylistDisplay = require('./services/ui/PlaylistDisplay');

const audio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(audio);
const tokenDisplay = new TokenDisplay();
const playlistDisplay = new PlaylistDisplay();

// Initialize volume
audio.volume = 0.7; // 70%

// Close button event listener
document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
});

// Volume control from WebSocket
ipcRenderer.on('set-volume', (event, volume) => {
  console.log('Setting volume to:', volume);
  if (audio) {
    const normalizedVolume = volume / 100;
    audio.volume = normalizedVolume;
    ipcRenderer.send('volume-changed', volume);
  }
});

// Playlist event handlers
ipcRenderer.on('playlist-received', (event, playlist) => {
  console.log('New playlist received:', playlist);
  
  // Hide token display and show playlist
  tokenDisplay.hide();
  playlistDisplay.displayPlaylist(playlist);
  
  const playlists = store.get('playlists', []);
  const existingIndex = playlists.findIndex(p => p._id === playlist._id);
  
  if (existingIndex !== -1) {
    playlists[existingIndex] = playlist;
  } else {
    playlists.push(playlist);
  }
  
  store.set('playlists', playlists);
  
  const shouldAutoPlay = playbackStateManager.getPlaybackState();
  if (shouldAutoPlay) {
    console.log('Auto-playing new playlist:', playlist);
    ipcRenderer.invoke('play-playlist', playlist);
  } else {
    console.log('Loading new playlist without auto-play');
    ipcRenderer.invoke('load-playlist', playlist);
  }
});

// Download progress handler
ipcRenderer.on('download-progress', (event, { songName, progress }) => {
  const progressBar = document.querySelector('.download-progress');
  const progressBarFill = document.querySelector('.download-progress-bar');
  const progressText = document.querySelector('.download-progress-text');
  
  if (progressBar && progressBarFill && progressText) {
    progressBar.style.display = 'block';
    progressBarFill.style.width = `${progress}%`;
    progressText.textContent = `${songName}: ${progress}%`;
    
    if (progress === 100) {
      setTimeout(() => {
        progressBar.style.display = 'none';
      }, 2000);
    }
  }
});

// Audio event listeners
audio.addEventListener('ended', () => {
  console.log('Song ended, playing next');
  ipcRenderer.invoke('song-ended');
});

ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
  console.log('Updating player with song:', currentSong);
  if (currentSong && currentSong.localPath) {
    const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
    audio.src = normalizedPath;
    
    const shouldAutoPlay = playbackStateManager.getPlaybackState();
    if (shouldAutoPlay) {
      audio.play().catch(err => console.error('Playback error:', err));
    }
  }
});

// İlk yüklemede token'ı göster
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, displaying token');
    tokenDisplay.displayToken();
    playlistDisplay.hide(); // Başlangıçta playlist'i gizle
});