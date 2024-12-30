const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const EmergencyStateHandler = require('./services/emergency/EmergencyStateHandler');
const AutoPlayManager = require('./services/playlist/AutoPlayManager');

const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);

// Başlangıçta emergency state kontrolü
EmergencyStateHandler.handleEmergencyState(playlistAudio, showEmergencyMessage);

// Emergency stop handler
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
  store.set('emergencyState', {
    isActive: true,
    timestamp: Date.now()
  });

  // UI'ı güncelle
  showEmergencyMessage();
});

// Otomatik playlist başlatma
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
  AutoPlayManager.handleAutoPlay(event, playlist, playlistAudio);
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

document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
});

// Anons kontrolleri
ipcRenderer.on('play-announcement', async (event, announcement) => {
  console.log('Received announcement:', announcement);
  
  // Anonsu çal
  const success = await AnnouncementAudioService.playAnnouncement(announcement);
  
  if (!success) {
    console.error('Failed to play announcement');
  }
});

// WebSocket bağlantı durumu
ipcRenderer.on('websocket-status', (event, isConnected) => {
    UIManager.updateConnectionStatus(isConnected);
});

// İndirme progress
ipcRenderer.on('download-progress', (event, { songName, progress }) => {
    UIManager.showDownloadProgress(progress, songName);
});

// Hata mesajları
ipcRenderer.on('error', (event, message) => {
    UIManager.showError(message);
});

// Volume control from WebSocket
ipcRenderer.on('set-volume', (event, volume) => {
    console.log('Setting volume to:', volume);
    // Volume değerini kaydet ve normalize et
    const savedVolume = VolumeManager.saveVolume(volume);
    const normalizedVolume = VolumeManager.normalizeVolume(savedVolume);
    
    // Audio player'a uygula
    playlistAudio.volume = normalizedVolume;
    
    // Volume değişikliğini bildir
    ipcRenderer.send('volume-changed', savedVolume);
});

// Restart playback from WebSocket
ipcRenderer.on('restart-playback', () => {
  console.log('Restarting playback');
  if (playlistAudio) {
    playlistAudio.currentTime = 0;
    playlistAudio.play().catch(err => console.error('Playback error:', err));
  }
});

// Toggle playback from WebSocket
ipcRenderer.on('toggle-playback', () => {
  console.log('Toggle playback, current state:', playlistAudio.paused);
  if (playlistAudio) {
    if (playlistAudio.paused) {
      playlistAudio.play()
        .then(() => {
          console.log('Playback started successfully');
          ipcRenderer.send('playback-status-changed', true);
        })
        .catch(err => {
          console.error('Playback error:', err);
          ipcRenderer.send('playback-status-changed', false);
        });
    } else {
      playlistAudio.pause();
      console.log('Playback paused');
      ipcRenderer.send('playback-status-changed', false);
    }
  }
});

// Otomatik playlist başlatma
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
  console.log('Auto-playing playlist:', playlist);
  if (playlist && playlist.songs && playlist.songs.length > 0) {
    const shouldAutoPlay = playbackStateManager.getPlaybackState();
    
    // Playlist'i başlat ve karıştır
    const initializedPlaylist = PlaylistInitializer.initializePlaylist(playlist);
    
    if (initializedPlaylist) {
      displayPlaylists();
      
      if (shouldAutoPlay) {
        console.log('Auto-playing with initialized playlist');
        ipcRenderer.invoke('play-playlist', initializedPlaylist.playlist);
      } else {
        console.log('Loading initialized playlist without auto-play');
        ipcRenderer.invoke('load-playlist', initializedPlaylist.playlist);
      }
    }
  }
});

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, displaying playlists');
  displayPlaylists();
});

// Toast bildirimleri için event listener
ipcRenderer.on('show-toast', (event, toast) => {
  switch(toast.type) {
    case 'success':
      new Notification('Başarılı', {
        body: toast.message
      });
      break;
    case 'error':
      new Notification('Hata', {
        body: toast.message
      });
      break;
    case 'loading':
      new Notification('İşlem Devam Ediyor', {
        body: toast.message
      });
      break;
  }
});
