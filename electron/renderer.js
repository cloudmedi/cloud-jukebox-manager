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
    emergencyStopped: true,
    wasPlaying: playlistAudio && !playlistAudio.paused,
    lastVolume: playlistAudio ? playlistAudio.volume : 0,
    lastTime: playlistAudio ? playlistAudio.currentTime : 0
  });

  // UI'ı güncelle
  showEmergencyMessage();
});

// Emergency reset handler
ipcRenderer.on('emergency-reset', () => {
  console.log('Emergency reset received');
  hideEmergencyMessage();
  
  // Önceki durumu kontrol et ve gerekirse oynatmayı devam ettir
  const store = new Store();
  const playbackState = store.get('playbackState');
  
  if (playbackState) {
    // Ses seviyesini geri yükle
    if (playlistAudio) {
      playlistAudio.volume = playbackState.lastVolume || 0.7;
    }
    
    // Eğer önceden çalıyorsa ve acil durum nedeniyle durdurulduysa
    if (playbackState.wasPlaying && playbackState.emergencyStopped) {
      console.log('Resuming playback after emergency reset');
      if (playlistAudio) {
        playlistAudio.currentTime = playbackState.lastTime || 0;
        playlistAudio.play().catch(err => console.error('Resume playback error:', err));
      }
    }
  }

  // Store'u temizle
  store.delete('playbackState');
});
