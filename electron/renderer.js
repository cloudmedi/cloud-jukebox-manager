const { ipcRenderer } = require('electron');

// Audio handling
let audio = new Audio();

ipcRenderer.on('load-audio', (event, data) => {
  console.log('Loading audio:', data);
  audio.src = data.path;
  audio.volume = data.volume / 100;
  if (data.autoplay) {
    audio.play().catch(console.error);
  }
});

ipcRenderer.on('audio-play', () => {
  console.log('Play command received');
  audio.play().catch(console.error);
});

ipcRenderer.on('audio-pause', () => {
  console.log('Pause command received');
  audio.pause();
});

ipcRenderer.on('audio-stop', () => {
  console.log('Stop command received');
  audio.pause();
  audio.currentTime = 0;
});

ipcRenderer.on('set-volume', (event, volume) => {
  console.log('Setting volume:', volume);
  audio.volume = volume / 100;
});

// Handle audio events
audio.addEventListener('ended', () => {
  console.log('Audio ended');
  ipcRenderer.send('audio-ended');
});

audio.addEventListener('error', (e) => {
  console.error('Audio error:', e);
  ipcRenderer.send('audio-error', e.message);
});

audio.addEventListener('play', () => {
  console.log('Audio started playing');
  ipcRenderer.send('playback-status-update', { isPlaying: true });
});

audio.addEventListener('pause', () => {
  console.log('Audio paused');
  ipcRenderer.send('playback-status-update', { isPlaying: false });
});

// Save volume state
window.addEventListener('beforeunload', () => {
  localStorage.setItem('savedVolume', audio.volume);
});

// Initialize volume from saved state
const savedVolume = localStorage.getItem('savedVolume');
if (savedVolume) {
  audio.volume = parseFloat(savedVolume);
}