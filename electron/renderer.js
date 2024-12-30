const { ipcRenderer } = require('electron');

// Audio handling
let audio = new Audio();

ipcRenderer.on('load-audio', (event, data) => {
  audio.src = data.path;
  audio.volume = data.volume;
  if (data.autoplay) {
    audio.play().catch(console.error);
  }
});

ipcRenderer.on('audio-play', () => {
  audio.play().catch(console.error);
});

ipcRenderer.on('audio-stop', () => {
  audio.pause();
  audio.currentTime = 0;
});

ipcRenderer.on('set-volume', (event, volume) => {
  audio.volume = volume;
});

// Handle audio events
audio.addEventListener('ended', () => {
  ipcRenderer.send('audio-ended');
});

audio.addEventListener('error', (e) => {
  ipcRenderer.send('audio-error', e.message);
});

// Handle playback controls
ipcRenderer.on('toggle-playback', () => {
  if (audio.paused) {
    audio.play().catch(console.error);
  } else {
    audio.pause();
  }
});

ipcRenderer.on('update-player', (event, data) => {
  if (data.currentSong) {
    audio.src = data.currentSong.localPath;
    if (data.isPlaying) {
      audio.play().catch(console.error);
    }
  }
});

// Emergency handlers
ipcRenderer.on('emergency-stop', () => {
  audio.pause();
  audio.volume = 0;
});

ipcRenderer.on('emergency-reset', () => {
  const savedVolume = localStorage.getItem('savedVolume');
  if (savedVolume) {
    audio.volume = parseFloat(savedVolume);
  }
});

// Volume persistence
window.addEventListener('beforeunload', () => {
  localStorage.setItem('savedVolume', audio.volume);
});

// Initialize volume from saved state
const savedVolume = localStorage.getItem('savedVolume');
if (savedVolume) {
  audio.volume = parseFloat(savedVolume);
}

// Playback status updates
audio.addEventListener('play', () => {
  ipcRenderer.send('playback-status-update', { isPlaying: true });
});

audio.addEventListener('pause', () => {
  ipcRenderer.send('playback-status-update', { isPlaying: false });
});

audio.addEventListener('timeupdate', () => {
  ipcRenderer.send('playback-time-update', {
    currentTime: audio.currentTime,
    duration: audio.duration
  });
});