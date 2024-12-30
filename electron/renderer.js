const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');
const PlayerUIManager = require('./services/ui/PlayerUIManager');
const VolumeManager = require('./services/audio/VolumeManager');
const ArtworkManager = require('./services/ui/ArtworkManager');
const ScreenshotEventHandler = require('./services/screenshot/ScreenshotEventHandler');

const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);

// Başlangıçta store'dan volume değerini al ve ayarla
const initialVolume = VolumeManager.getStoredVolume();
playlistAudio.volume = VolumeManager.normalizeVolume(initialVolume);
console.log('Initial volume set from store:', initialVolume);

ipcRenderer.on('emergency-stop', () => {
  console.log('Emergency stop received');
  
  // Tüm ses çalmayı durdur
  if (playlistAudio) {
    playlistAudio.pause();
    playlistAudio.currentTime = 0;
    playlistAudio.volume = 0;
  }

  // Anons sesini durdur
  const campaignAudio = document.getElementById('campaignPlayer');
  if (campaignAudio) {
    campaignAudio.pause();
    campaignAudio.currentTime = 0;
    campaignAudio.volume = 0;
  }

  // Store'u güncelle
  const store = new Store();
  store.set('playbackState', {
    isPlaying: false,
    emergencyStopped: true
  });

  // UI'ı güncelle
  showEmergencyMessage();
});

// Emergency reset handler
ipcRenderer.on('emergency-reset', () => {
  console.log('Emergency reset received');
  hideEmergencyMessage();
  
  // Resume playback if it was playing before emergency
  const playbackState = store.get('playbackState');
  if (playbackState && playbackState.wasPlaying) {
    console.log('Resuming playback after emergency reset');
    const playlistAudio = document.getElementById('audioPlayer');
    if (playlistAudio) {
      playlistAudio.volume = playbackState.volume || 0.7; // Restore previous volume or default
      playlistAudio.play().catch(err => console.error('Resume playback error:', err));
    }
  }
});

// Emergency message handlers
ipcRenderer.on('show-emergency-message', (event, data) => {
  showEmergencyMessage(data.title, data.message);
});

ipcRenderer.on('hide-emergency-message', () => {
  hideEmergencyMessage();
});

function showEmergencyMessage(title = 'Acil Durum Aktif', message = 'Müzik yayını geçici olarak durdurulmuştur.') {
  const container = document.createElement('div');
  container.id = 'emergency-message';
  container.className = 'emergency-banner';
  container.innerHTML = `
    <h3 class="emergency-title">${title}</h3>
    <p class="emergency-text">${message}</p>
  `;
  
  // Find the playlist container and append the emergency message at the bottom
  const playlistContainer = document.querySelector('.playlist-container');
  if (playlistContainer) {
    playlistContainer.appendChild(container);
  } else {
    document.body.appendChild(container);
  }
}

function hideEmergencyMessage() {
  const container = document.getElementById('emergency-message');
  if (container) {
    container.remove();
  }
}

// Uygulama başlangıcında acil durum kontrolü
document.addEventListener('DOMContentLoaded', () => {
  const emergencyState = store.get('emergencyState');
  if (emergencyState && emergencyState.isActive) {
    console.log('Emergency state active on startup');
    if (playlistAudio) {
      playlistAudio.volume = 0;
    }
    showEmergencyMessage();
  }
});
