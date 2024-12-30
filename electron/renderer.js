const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/handlers/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const websocketService = require('./services/websocketService');
const EmergencyStateManager = require('./services/emergency/EmergencyStateManager');
const VolumeManager = require('./services/audio/VolumeManager');
const ArtworkManager = require('./services/ui/ArtworkManager');
const ScreenshotEventHandler = require('./services/screenshot/ScreenshotEventHandler');

const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);

// Başlangıçta emergency state kontrolü
const emergencyState = store.get('emergencyState');
if (emergencyState?.active) {
  EmergencyStateManager.setEmergencyState(true);
}

// Token kontrolü ve WebSocket bağlantısı
const deviceInfo = store.get('deviceInfo');
if (deviceInfo && deviceInfo.token) {
  websocketService.connect(deviceInfo.token);
}

// Volume kontrolü
const savedVolume = store.get('volume');
if (savedVolume !== undefined) {
  VolumeManager.setVolume(savedVolume);
  if (playlistAudio) {
    playlistAudio.volume = savedVolume / 100;
  }
}

// Screenshot event handler'ı başlat
ScreenshotEventHandler.initialize();

// WebSocket mesaj dinleyicileri
websocketService.addMessageHandler('command', (message) => {
  console.log('Command received:', message);
  
  switch (message.command) {
    case 'play':
      playlistAudio.play();
      break;
    case 'pause':
      playlistAudio.pause();
      break;
    case 'setVolume':
      VolumeManager.setVolume(message.volume);
      break;
    case 'screenshot':
      ScreenshotEventHandler.takeScreenshot();
      break;
  }
});

// Playlist yükleme ve çalma işlemleri
ipcRenderer.on('play-playlist', async (event, playlist) => {
  console.log('Play playlist request received:', playlist);
  
  if (!playlist || !playlist.songs || playlist.songs.length === 0) {
    console.error('Invalid playlist or empty songs array');
    return;
  }

  try {
    const currentSong = playlist.songs[0];
    console.log('Current song:', currentSong);

    if (!currentSong.localPath) {
      console.error('Song localPath is missing:', currentSong);
      return;
    }

    const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
    playlistAudio.src = normalizedPath;
    
    console.log('Setting audio source to:', normalizedPath);
    
    playlistAudio.play().catch(err => {
      console.error('Playback error:', err);
    });
    
    // Playback state'i güncelle
    playbackStateManager.updateState({
      currentSong,
      playlist,
      isPlaying: true
    });

  } catch (error) {
    console.error('Playlist playback error:', error);
  }
});

// Ses dosyası bittiğinde sonraki şarkıya geç
playlistAudio.addEventListener('ended', () => {
  ipcRenderer.invoke('song-ended');
});

// Ses seviyesi değiştiğinde
ipcRenderer.on('set-volume', (event, volume) => {
  console.log('Volume change requested:', volume);
  VolumeManager.setVolume(volume);
});

// Emergency stop
ipcRenderer.on('emergency-stop', () => {
  playlistAudio.pause();
  EmergencyStateManager.setEmergencyState(true);
  store.set('emergencyState', { active: true });
});

// Emergency reset
ipcRenderer.on('emergency-reset', () => {
  EmergencyStateManager.setEmergencyState(false);
  store.delete('emergencyState');
  const currentState = playbackStateManager.getCurrentState();
  if (currentState.isPlaying) {
    playlistAudio.play();
  }
});

// Artwork yükleme hatası
playlistAudio.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') {
    ArtworkManager.handleArtworkError(e.target);
  }
});

// Playback durumu değiştiğinde
playlistAudio.addEventListener('play', () => {
  websocketService.sendMessage({
    type: 'playbackStatus',
    status: 'playing'
  });
});

playlistAudio.addEventListener('pause', () => {
  websocketService.sendMessage({
    type: 'playbackStatus',
    status: 'paused'
  });
});

// Şarkı yüklendiğinde
playlistAudio.addEventListener('loadeddata', () => {
  const currentState = playbackStateManager.getCurrentState();
  if (currentState.isPlaying && !EmergencyStateManager.isEmergencyActive()) {
    playlistAudio.play();
  }
});

