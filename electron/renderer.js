const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

// Initialize WebSocket connection
const deviceInfo = store.get('deviceInfo');
if (deviceInfo && deviceInfo.token) {
  ipcRenderer.invoke('init-websocket', deviceInfo.token);
}

// Handle device registration
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = document.getElementById('token-input').value;
  
  try {
    const deviceInfo = await ipcRenderer.invoke('save-device-info', { token });
    if (deviceInfo) {
      ipcRenderer.invoke('init-websocket', deviceInfo.token);
    }
  } catch (error) {
    console.error('Device registration failed:', error);
  }
});

// Audio player controls
let isPlaying = false;

document.getElementById('play-button')?.addEventListener('click', () => {
  isPlaying = !isPlaying;
  ipcRenderer.send('playback-status-changed', isPlaying);
});

document.getElementById('next-button')?.addEventListener('click', () => {
  ipcRenderer.send('next-track');
});

// Handle song changes
ipcRenderer.on('update-current-song', (event, song) => {
  if (song) {
    document.getElementById('current-song')?.textContent = song.name;
    document.getElementById('current-artist')?.textContent = song.artist;
    ipcRenderer.send('song-changed', song);
  }
});

// Handle playback status changes
ipcRenderer.on('toggle-playback', () => {
  isPlaying = !isPlaying;
  ipcRenderer.send('playback-status-changed', isPlaying);
});

// Handle playlist updates
ipcRenderer.on('update-playlist', (event, playlist) => {
  if (playlist) {
    document.getElementById('playlist-name')?.textContent = playlist.name;
  }
});

// Handle volume changes
ipcRenderer.on('set-volume', (event, volume) => {
  const audioElement = document.querySelector('audio');
  if (audioElement) {
    audioElement.volume = volume / 100;
  }
});

// Handle window focus
window.addEventListener('focus', () => {
  ipcRenderer.send('window-focused');
});

// Handle window blur
window.addEventListener('blur', () => {
  ipcRenderer.send('window-blurred');
});

// Export for preload script
window.electron = {
  ipcRenderer: {
    send: ipcRenderer.send.bind(ipcRenderer),
    on: ipcRenderer.on.bind(ipcRenderer),
    invoke: ipcRenderer.invoke.bind(ipcRenderer)
  }
};