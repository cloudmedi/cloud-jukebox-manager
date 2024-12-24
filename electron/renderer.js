const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioManager = require('./services/audio/AudioManager');
const AnnouncementScheduler = require('./services/announcement/AnnouncementScheduler');
const UIManager = require('./services/ui/UIManager');

// Initialize managers
const audioManager = new AudioManager();

// Close button handler
document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
});

// IPC Event Handlers
ipcRenderer.on('play-announcement', async (event, announcement) => {
  console.log('Received announcement:', announcement);
  const success = await audioManager.playAnnouncement(announcement);
  
  if (!success) {
    console.error('Failed to play announcement');
  }
});

ipcRenderer.on('check-announcement-schedule', (event, songCounter) => {
  const announcement = AnnouncementScheduler.checkSchedule(songCounter);
  if (announcement) {
    audioManager.playAnnouncement(announcement);
  }
});

ipcRenderer.on('pause-playback', () => {
  if (audioManager.playlistAudio && !audioManager.playlistAudio.paused) {
    audioManager.playlistAudio.pause();
  }
});

ipcRenderer.on('resume-playback', () => {
  if (audioManager.playlistAudio && audioManager.playlistAudio.paused) {
    audioManager.playlistAudio.play().catch(err => console.error('Resume playback error:', err));
  }
});

// WebSocket status handler
ipcRenderer.on('websocket-status', (event, isConnected) => {
  UIManager.updateConnectionStatus(isConnected);
});

// Download progress handler
ipcRenderer.on('download-progress', (event, { songName, progress }) => {
  UIManager.showDownloadProgress(progress, songName);
});

// Error handler
ipcRenderer.on('error', (event, message) => {
  UIManager.showError(message);
});

// Volume control handler
ipcRenderer.on('set-volume', (event, volume) => {
  console.log('Setting volume to:', volume);
  audioManager.setVolume(volume);
  ipcRenderer.send('volume-changed', volume);
});

// Playlist handlers
ipcRenderer.on('playlist-received', (event, playlist) => {
  console.log('New playlist received:', playlist);
  
  const playlists = store.get('playlists', []);
  const existingIndex = playlists.findIndex(p => p._id === playlist._id);
  
  if (existingIndex !== -1) {
    playlists[existingIndex] = playlist;
  } else {
    playlists.push(playlist);
  }
  
  store.set('playlists', playlists);
  audioManager.resetSongCounter(); // Yeni playlist geldiğinde sayacı sıfırla
  
  displayPlaylists();
});

// Display playlists function
function displayPlaylists() {
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  if (!playlistContainer) {
    console.error('Playlist container not found');
    return;
  }
  
  playlistContainer.innerHTML = '';
  
  // Son playlist'i göster
  const lastPlaylist = playlists[playlists.length - 1];
  if (lastPlaylist) {
    const playlistElement = document.createElement('div');
    playlistElement.className = 'playlist-item';
    playlistElement.innerHTML = `
      <div class="playlist-info">
        ${lastPlaylist.artwork ? 
          `<img src="${lastPlaylist.artwork}" alt="${lastPlaylist.name}" class="playlist-artwork"/>` :
          '<div class="playlist-artwork-placeholder"></div>'
        }
        <div class="playlist-details">
          <h3>${lastPlaylist.name}</h3>
          <p>${lastPlaylist.songs[0]?.artist || 'Unknown Artist'}</p>
          <p>${lastPlaylist.songs[0]?.name || 'No songs'}</p>
        </div>
      </div>
    `;
    
    playlistContainer.appendChild(playlistElement);
    console.log('Displayed playlist:', lastPlaylist.name);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, displaying playlists');
  displayPlaylists();
});
