const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const webSocketMessageHandler = require('./services/websocket/WebSocketMessageHandler');

const audio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(audio);

// Initialize volume
audio.volume = 0.7; // 70%

// WebSocket message handler
ipcRenderer.on('ws-message', (event, message) => {
  webSocketMessageHandler.handleMessage(message);
});

// Handle playlist cleared event
ipcRenderer.on('playlists-cleared', () => {
  console.log('All playlists have been cleared');
  if (audio) {
    audio.pause();
    audio.src = '';
  }
  
  // Cihaz bilgilerini göster
  const deviceInfo = store.get('deviceInfo');
  if (deviceInfo?.token) {
    console.log('Displaying device info after clearing playlists');
    displayDeviceInfo(deviceInfo);
  }
});

function displayDeviceInfo(deviceInfo) {
  const playlistContainer = document.getElementById('playlistContainer');
  if (playlistContainer) {
    playlistContainer.innerHTML = `
      <div class="device-info p-4 bg-gray-100 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">Cihaz Bilgileri</h2>
        <p class="text-sm">Token: ${deviceInfo.token}</p>
      </div>
    `;
  }
}

// Auto-play playlist
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
  console.log('Auto-playing playlist:', playlist);
  if (playlist && playlist.songs && playlist.songs.length > 0) {
    const playbackState = playbackStateManager.getPlaybackState();
    audioHandler.setCurrentPlaylistId(playlist._id);
    
    const shouldAutoPlay = playbackState.playlistId === playlist._id ? 
      playbackState.isPlaying : false;
    
    console.log('Should auto-play:', shouldAutoPlay, 'Playback state:', playbackState);
    
    displayPlaylists();
    
    if (shouldAutoPlay) {
      console.log('Auto-playing based on saved state');
      ipcRenderer.invoke('play-playlist', playlist);
    } else {
      console.log('Not auto-playing due to saved state');
      ipcRenderer.invoke('load-playlist', playlist);
    }
  }
});

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

// Restart playback from WebSocket
ipcRenderer.on('restart-playback', () => {
  console.log('Restarting playback');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(err => console.error('Playback error:', err));
  }
});

// Toggle playback from WebSocket
ipcRenderer.on('toggle-playback', () => {
  console.log('Toggle playback, current state:', audio.paused);
  if (audio) {
    if (audio.paused) {
      audio.play()
        .then(() => {
          console.log('Playback started successfully');
          ipcRenderer.send('playback-status-changed', true);
        })
        .catch(err => {
          console.error('Playback error:', err);
          ipcRenderer.send('playback-status-changed', false);
        });
    } else {
      audio.pause();
      console.log('Playback paused');
      ipcRenderer.send('playback-status-changed', false);
    }
  }
});

function displayPlaylists() {
  const deviceInfo = store.get('deviceInfo');
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  if (!playlistContainer) {
    console.error('Playlist container not found');
    return;
  }
  
  playlistContainer.innerHTML = '';

  // Eğer cihaz bilgisi yoksa
  if (!deviceInfo || !deviceInfo.token) {
    playlistContainer.innerHTML = `
      <div class="no-device-info">
        <h2>Hoş Geldiniz</h2>
        <p>Cihaz henüz kaydedilmemiş. Lütfen cihazı kaydetmek için Cloud Media Manager uygulamasını kullanın.</p>
        <p>Token: Bekleniyor...</p>
      </div>
    `;
    return;
  }

  // Eğer playlist yoksa
  if (!playlists.length) {
    playlistContainer.innerHTML = `
      <div class="no-playlists">
        <h2>Playlist Bulunamadı</h2>
        <p>Henüz hiç playlist indirilmemiş.</p>
        <p>Cloud Media Manager üzerinden bir playlist göndererek başlayabilirsiniz.</p>
      </div>
    `;
    return;
  }
  
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

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, displaying playlists');
  displayPlaylists();
});
