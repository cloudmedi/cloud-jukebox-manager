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

ipcRenderer.on('pause-playback', () => {
  if (playlistAudio && !playlistAudio.paused) {
    playlistAudio.pause();
  }
});

ipcRenderer.on('resume-playback', () => {
  if (playlistAudio && playlistAudio.paused) {
    playlistAudio.play().catch(err => console.error('Resume playback error:', err));
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

function displayPlaylists() {
  console.log('=== PLAYLIST DISPLAY DEBUG LOGS ===');
  console.log('1. Starting displayPlaylists()');
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  if (!playlistContainer) {
    console.error('2. Playlist container not found');
    return;
  }
  
  console.log('3. Current playlists in store:', playlists);
  
  playlistContainer.innerHTML = '';
  
  // Son playlist'i göster
  const lastPlaylist = playlists[playlists.length - 1];
  if (lastPlaylist) {
    console.log('4. Last playlist details:', {
      id: lastPlaylist._id,
      name: lastPlaylist.name,
      songCount: lastPlaylist.songs.length,
      firstSong: lastPlaylist.songs[0],
      artwork: lastPlaylist.artwork
    });

    const playlistElement = document.createElement('div');
    playlistElement.className = 'playlist-item';
    
    // Artwork URL'ini doğrudan kullan
    const artworkUrl = lastPlaylist.artwork ? `http://localhost:5000${lastPlaylist.artwork}` : null;
    console.log('5. Artwork URL:', artworkUrl);
    
    playlistElement.innerHTML = `
      <div class="playlist-info">
        ${artworkUrl 
          ? `<img src="${artworkUrl}" alt="${lastPlaylist.name}" class="playlist-artwork" onerror="console.error('Artwork yükleme hatası:', this.src)"/>`
          : '<div class="playlist-artwork-placeholder"></div>'
        }
        <div class="playlist-details">
          <h3>${lastPlaylist.name}</h3>
          <p>${lastPlaylist.songs[0]?.artist || 'Unknown Artist'}</p>
          <p>${lastPlaylist.songs[0]?.name || 'No songs'}</p>
        </div>
      </div>
    `;
    
    console.log('6. Playlist element created');
    playlistContainer.appendChild(playlistElement);

    // Artwork yükleme durumunu kontrol et
    const artworkImg = playlistElement.querySelector('img');
    if (artworkImg) {
      artworkImg.addEventListener('load', () => {
        console.log('7. Artwork başarıyla yüklendi:', artworkImg.src);
      });
      
      artworkImg.addEventListener('error', (error) => {
        console.error('8. Artwork yükleme hatası:', {
          src: artworkImg.src,
          error: error
        });
      });
    }
  }
}

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
