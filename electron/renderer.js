const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

const AudioEventHandler = require('./services/audio/AudioEventHandler');
const VolumeController = require('./services/audio/VolumeController');
const ArtworkManager = require('./services/ui/ArtworkManager');
const ScreenshotEventHandler = require('./services/screenshot/ScreenshotEventHandler');
const ScheduleController = require('./services/schedule/ScheduleController');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');
const PlayerUIManager = require('./services/ui/PlayerUIManager');

const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);
const artworkManager = new ArtworkManager();
const screenshotHandler = new ScreenshotEventHandler();
const scheduleController = new ScheduleController();
const volumeController = VolumeController.getInstance();

const playbackBadge = document.getElementById('playbackBadge');

// Badge durumunu güncelleme fonksiyonu
function updatePlaybackBadge(state) {
    playbackBadge.className = 'status-badge';
    
    if (!store.get('playlists') || store.get('playlists').length === 0) {
        playbackBadge.classList.add('no-playlist');
        return;
    }

    if (state === 'playing') {
        playbackBadge.classList.add('playing');
    } else {
        playbackBadge.classList.add('paused');
    }
}

// Playback state güncelleme
function updatePlaybackStatus(isPlaying) {
  try {
    ipcRenderer.invoke('send-playback-status', {
      type: 'playbackStatus',
      status: isPlaying ? 'playing' : 'paused'
    });
    
    // Tray menüsünü güncelle
    ipcRenderer.send('playback-status-changed', isPlaying);
  } catch (error) {
    console.error('Error updating playback status:', error);
  }
}

// Audio event listeners
playlistAudio.addEventListener('play', () => {
    const currentState = playbackStateManager.getPlaybackState();
    if (!currentState) {
        console.log('Preventing auto-play, playback state is paused');
        playlistAudio.pause();
        return;
    }

    ipcRenderer.invoke('song-started');
    console.log('Audio started playing');
    updatePlaybackBadge('playing');
    updatePlaybackStatus(true);
    
    // WebSocket üzerinden oynatma durumunu gönder
    ipcRenderer.invoke('send-playback-status', {
        type: 'deviceStatus',
        isPlaying: true
    });
});

playlistAudio.addEventListener('pause', () => {
    console.log('Audio paused');
    updatePlaybackBadge('paused');
    updatePlaybackStatus(false);
    
    // WebSocket üzerinden duraklatma durumunu gönder
    ipcRenderer.invoke('send-playback-status', {
        type: 'deviceStatus',
        isPlaying: false
    });
});

playlistAudio.addEventListener('ended', () => {
    console.log('14. Song ended, playing next');
    ipcRenderer.invoke('song-ended');
});

playlistAudio.addEventListener('loadeddata', () => {
    console.log('17. Audio data loaded successfully');
});

playlistAudio.addEventListener('error', (e) => {
    console.error('18. Audio error:', e);
});

// İlk yüklemede badge durumunu ayarla
document.addEventListener('DOMContentLoaded', () => {
    const playlists = store.get('playlists', []);
    if (!playlists || playlists.length === 0) {
        updatePlaybackBadge('no-playlist');
    } else {
        updatePlaybackBadge(playlistAudio.paused ? 'paused' : 'playing');
    }
});

// Başlangıçta emergency state kontrolü
const emergencyState = store.get('emergencyState');
if (emergencyState && emergencyState.isActive) {
  console.log('Emergency state is active on startup');
  if (playlistAudio) {
    playlistAudio.pause();
    playlistAudio.currentTime = 0;
    playlistAudio.volume = 0;
  }
  showEmergencyMessage();
}

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
      playlistAudio.volume = playbackState.volume || 0.7;
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

// Playlist error event'ini dinle
ipcRenderer.on('playlist-error', (event, error) => {
  console.error('Playlist error:', error);
  // Kullanıcıya hata bildir
  new Notification('Playlist Error', {
    body: error
  });
});

// Volume değişikliği event listener'ı
ipcRenderer.on('set-volume', (event, volume) => {
    console.log('Setting volume to:', volume);
    if (volumeController && playlistAudio) {
        volumeController.setVolume(volume);
        playlistAudio.volume = volumeController.getNormalizedVolume();
        scheduleController.setVolume(volumeController.getNormalizedVolume());
    }
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
          playbackStateManager.savePlaybackState(true);
          ipcRenderer.send('playback-status-changed', true);
          // WebSocket üzerinden oynatma durumunu gönder
          ipcRenderer.invoke('send-playback-status', {
            type: 'deviceStatus',
            isPlaying: true
          });
        })
        .catch(err => {
          console.error('Playback error:', err);
          ipcRenderer.send('playback-status-changed', false);
        });
    } else {
      playlistAudio.pause();
      console.log('Playback paused');
      playbackStateManager.savePlaybackState(false);
      ipcRenderer.send('playback-status-changed', false);
      // WebSocket üzerinden duraklatma durumunu gönder
      ipcRenderer.invoke('send-playback-status', {
        type: 'deviceStatus',
        isPlaying: false
      });
    }
  }
});

// Otomatik playlist başlatma
ipcRenderer.on('auto-play-playlist', async (event, playlist) => {
  try {
    console.log('Auto-playing playlist:', playlist);
    
    if (!playlist || !playlist.songs || !Array.isArray(playlist.songs)) {
      console.error('Invalid auto-play playlist:', playlist);
      return;
    }

    const shouldAutoPlay = playbackStateManager.getPlaybackState();
    if (shouldAutoPlay) {
      await startPlaylist(playlist);
    } else {
      console.log('Loading playlist without auto-play');
      await ipcRenderer.invoke('load-playlist', playlist);
    }
  } catch (error) {
    console.error('Error handling auto-play playlist:', error);
  }
});

// Playback komutları için event listener
ipcRenderer.on('playback-command', (event, data) => {
  console.log('Playback command received:', data);
  
  if (data.action === 'play') {
    console.log('Playing audio...');
    playlistAudio.play().catch(err => {
      console.error('Play error:', err);
    });
    playbackStateManager.savePlaybackState(true);
  } else if (data.action === 'pause') {
    console.log('Pausing audio...');
    playlistAudio.pause();
    playbackStateManager.savePlaybackState(false);
  }
});

// WebSocket komut dinleyicisi
ipcRenderer.on('playback-command', (event, data) => {
  console.log('Playback command received:', data);
  
  switch (data.action) {
    case 'play':
      if (playlistAudio.paused) {
        playlistAudio.play();
      }
      break;
      
    case 'pause':
      if (!playlistAudio.paused) {
        playlistAudio.pause();
      }
      break;
  }
});

// Playlist başlatma fonksiyonu
async function startPlaylist(playlist) {
  try {
    if (!playlist || !playlist.songs || !Array.isArray(playlist.songs)) {
      console.error('Invalid playlist:', playlist);
      return;
    }

    // Önce aktif schedule kontrolü yap
    const hasActiveSchedule = await ipcRenderer.invoke('check-active-schedule');
    if (hasActiveSchedule) {
      console.log('Cannot start playlist - active schedule exists');
      new Notification('Schedule Active', {
        body: 'Cannot play playlist while a schedule is active'
      });
      return;
    }

    console.log('Starting playlist:', playlist.name);
    const result = await ipcRenderer.invoke('play-playlist', playlist);
    
    if (!result.success) {
      console.error('Failed to start playlist:', result.error);
      new Notification('Playlist Error', {
        body: result.error
      });
      return;
    }

    // Playlist başarıyla başlatıldı
    console.log('Playlist started successfully');
  } catch (error) {
    console.error('Error starting playlist:', error);
    new Notification('Playlist Error', {
      body: error.message
    });
  }
}

// WebSocket mesaj dinleyicileri
ipcRenderer.on('playlist-received', async (event, playlist) => {
  try {
    console.log('New playlist received:', playlist);
    
    if (!playlist || !playlist.songs || !Array.isArray(playlist.songs)) {
      console.error('Invalid received playlist:', playlist);
      return;
    }
    
    const playlists = store.get('playlists', []);
    const existingIndex = playlists.findIndex(p => p._id === playlist._id);
    
    if (existingIndex !== -1) {
      playlists[existingIndex] = playlist;
    } else {
      playlists.push(playlist);
    }
    
    store.set('playlists', playlists);
    
    const shouldAutoPlay = playbackStateManager.getPlaybackState();
    if (shouldAutoPlay) {
      await startPlaylist(playlist);
    } else {
      console.log('Loading new playlist without auto-play');
      await ipcRenderer.invoke('load-playlist', playlist);
    }
    
    deleteOldPlaylists();
    displayPlaylists();
    
    new Notification('Yeni Playlist', {
      body: `${playlist.name} playlist'i başarıyla indirildi.`
    });
  } catch (error) {
    console.error('Error handling new playlist:', error);
  }
});

// Playlist event'lerini dinle
ipcRenderer.on('playlist-updated', async (event, data) => {
  try {
    if (data.action === 'play') {
      const canStart = await checkAndStartPlaylist();
      if (!canStart) {
        console.log('Cannot start playlist - active schedule exists');
        return;
      }
    }
    
    // Event'i işle
    handlePlaylistEvent(data);
  } catch (error) {
    console.error('Error handling playlist event:', error);
  }
});

// Playlist event handler
async function handlePlaylistEvent(data) {
  switch (data.action) {
    case 'play':
      if (data.song) {
        currentPlaylistSong = data.song;
        if (playlistAudio) {
          playlistAudio.src = data.song.url;
          const canStart = await checkAndStartPlaylist();
          if (canStart) {
            await playlistAudio.play();
          }
        }
        updateNowPlaying(data.song);
      }
      break;
    case 'stop':
      if (playlistAudio) {
        playlistAudio.pause();
        playlistAudio.currentTime = 0;
      }
      break;
    case 'update':
      if (data.playlists) {
        displayPlaylists(data.playlists);
      }
      break;
  }
}

// Audio event'lerini dinle
if (playlistAudio) {
  playlistAudio.addEventListener('ended', () => {
    ipcRenderer.invoke('song-ended');
  });

  playlistAudio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    ipcRenderer.invoke('song-error', e.message);
  });

  playlistAudio.addEventListener('play', () => {
    isPlaying = true;
    updatePlaybackStatus(true);
  });

  playlistAudio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlaybackStatus(false);
  });
}

// Update the delete message handler
ipcRenderer.on('device-deleted', (event, id) => {
  console.log('Device deleted, cleaning up...');
  
  // Stop any playing audio
  if (playlistAudio) {
    playlistAudio.pause();
    playlistAudio.src = '';
  }

  // Clear all stored data
  store.clear();
  
  // Only keep device token if it exists
  const deviceToken = store.get('deviceInfo.token');
  const deviceInfo = store.get('deviceInfo.deviceInfo');
  if (deviceToken && deviceInfo) {
    store.set('deviceInfo', {
      token: deviceToken,
      deviceInfo: deviceInfo
    });
  }

  // Clear UI
  const playlistContainer = document.getElementById('playlistContainer');
  if (playlistContainer) {
    playlistContainer.innerHTML = '';
  }
});

ipcRenderer.on('songRemoved', (event, { songId, playlistId }) => {
  console.log('Şarkı silme mesajı alındı:', { songId, playlistId });
  
  const playlists = store.get('playlists', []);
  const playlistIndex = playlists.findIndex(p => p._id === playlistId);
  
  if (playlistIndex !== -1) {
    console.log('Playlist bulundu:', playlistId);
    // Playlistten şarkıyı kaldır
    const removedSong = playlists[playlistIndex].songs.find(s => s._id === songId);
    playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(
      song => song._id !== songId
    );
    
    // Store'u güncelle
    store.set('playlists', playlists);
    console.log('Playlist güncellendi');
    
    // Yerel dosyayı sil
    if (removedSong && removedSong.localPath) {
      try {
        // Şarkı dosyasını sil
        fs.unlinkSync(removedSong.localPath);
        console.log('Deleted song file:', removedSong.localPath);
        
        // Şarkının bulunduğu klasörü bul
        const playlistDir = path.dirname(removedSong.localPath);
        
        // Klasördeki tüm dosyaları sil
        const files = fs.readdirSync(playlistDir);
        files.forEach(file => {
          const filePath = path.join(playlistDir, file);
          fs.unlinkSync(filePath);
          console.log('Deleted file:', filePath);
        });
        
        // Boş klasörü sil
        fs.rmdirSync(playlistDir);
        console.log('Deleted playlist directory:', playlistDir);
      } catch (error) {
        console.error('Error deleting files/directory:', error);
      }
    }
  } else {
    console.log('Playlist bulunamadı:', playlistId);
  }
});

// Update the update-player event handler
ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
  console.log('1. Update Player Event Received:', { playlist, currentSong });
  
  if (currentSong && currentSong.localPath) {
    console.log('2. Current Song Data:', {
      name: currentSong.name,
      artist: currentSong.artist,
      localPath: currentSong.localPath
    });

    const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
    playlistAudio.src = normalizedPath;
    
    console.log('3. Setting audio source to:', normalizedPath);
    
    playlistAudio.play().catch(err => {
      console.error('4. Playback error:', err);
    });
    
    // UI'ı güncelle
    PlayerUIManager.updateCurrentSong(currentSong);
    
    // Tray menüsünü güncelle
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
  } else {
    console.warn('7. Invalid song data received:', currentSong);
  }
});

// Sonraki şarkı için event listener
ipcRenderer.on('next-song', () => {
  console.log('Next song requested from tray menu');
  ipcRenderer.invoke('song-ended');
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

// ScheduleController'ı entegre et
// const scheduleController = new ScheduleController();

// Schedule event'lerini dinle
ipcRenderer.on('schedule-downloaded', (event, scheduleId) => {
  console.log('Schedule downloaded:', scheduleId);
});

ipcRenderer.on('schedule-download-progress', (event, data) => {
  console.log('Schedule download progress:', data);
});

ipcRenderer.on('schedule-download-error', (event, error) => {
  console.error('Schedule download error:', error);
});

// Schedule error event'ini dinle
ipcRenderer.on('schedule-error', (event, error) => {
  console.error('Schedule error:', error);
  new Notification('Schedule Error', {
    body: error.message
  });
});

// Hata mesajlarını göster
ipcRenderer.on('show-error', (event, message) => {
  showError(message);
});

// Hata mesajını göster
function showError(message) {
  const errorContainer = document.getElementById('errorContainer');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }
}

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
      firstSong: lastPlaylist.songs[0]
    });

    console.log('5. Artwork details:', {
      hasArtwork: !!lastPlaylist.artwork,
      artworkPath: lastPlaylist.artwork,
      fullArtworkUrl: ArtworkManager.getArtworkUrl(lastPlaylist.artwork)
    });

    const playlistElement = document.createElement('div');
    playlistElement.className = 'playlist-item';
    
    const artworkHtml = ArtworkManager.createArtworkHtml(lastPlaylist.artwork, lastPlaylist.name);
    
    console.log('6. Generated artwork HTML:', artworkHtml);
    
    playlistElement.innerHTML = `
      <div class="playlist-info">
        ${artworkHtml}
        <div class="playlist-details">
          <h3>${lastPlaylist.name}</h3>
          <p>${lastPlaylist.songs[0]?.artist || 'Unknown Artist'}</p>
          <p>${lastPlaylist.songs[0]?.name || 'No songs'}</p>
        </div>
      </div>
    `;
    
    console.log('7. Playlist element created with artwork');
    playlistContainer.appendChild(playlistElement);
    console.log('8. Playlist element added to DOM');

    // Artwork yükleme durumunu kontrol et
    const artworkImg = playlistElement.querySelector('img');
    if (artworkImg) {
      artworkImg.addEventListener('load', () => {
        console.log('9. Artwork başarıyla yüklendi:', artworkImg.src);
      });
      
      artworkImg.addEventListener('error', (error) => {
        console.error('10. Artwork yükleme hatası:', {
          src: artworkImg.src,
          error: error
        });
      });
    }
  } else {
    console.warn('11. No playlist available to display');
  }
  console.log('=== END PLAYLIST DISPLAY DEBUG LOGS ===');
}

function deleteOldPlaylists() {
  const playlists = store.get('playlists', []);
  
  // Son playlist hariç tüm playlistleri sil
  if (playlists.length > 1) {
    const latestPlaylist = playlists[playlists.length - 1];
    
    // Eski playlistlerin şarkı dosyalarını ve klasörlerini sil
    playlists.slice(0, -1).forEach(playlist => {
      playlist.songs.forEach(song => {
        if (song.localPath) {
          try {
            // Şarkı dosyasını sil
            fs.unlinkSync(song.localPath);
            console.log(`Deleted song file: ${song.localPath}`);
            
            // Şarkının bulunduğu klasörü bul
            const playlistDir = path.dirname(song.localPath);
            
            // Klasördeki tüm dosyaları sil
            const files = fs.readdirSync(playlistDir);
            files.forEach(file => {
              const filePath = path.join(playlistDir, file);
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
            });
            
            // Boş klasörü sil
            fs.rmdirSync(playlistDir);
            console.log(`Deleted playlist directory: ${playlistDir}`);
          } catch (error) {
            console.error(`Error deleting files/directory: ${error}`);
          }
        }
      });
    });
    
    // Store'u güncelle, sadece son playlisti tut
    store.set('playlists', [latestPlaylist]);
    console.log('Kept only the latest playlist:', latestPlaylist.name);
  }
}

// WebSocket mesaj dinleyicileri
ipcRenderer.on('playlist-received', async (event, playlist) => {
  try {
    console.log('New playlist received:', playlist);
    
    if (!playlist || !playlist.songs || !Array.isArray(playlist.songs)) {
      console.error('Invalid received playlist:', playlist);
      return;
    }
    
    const playlists = store.get('playlists', []);
    const existingIndex = playlists.findIndex(p => p._id === playlist._id);
    
    if (existingIndex !== -1) {
      playlists[existingIndex] = playlist;
    } else {
      playlists.push(playlist);
    }
    
    store.set('playlists', playlists);
    
    const shouldAutoPlay = playbackStateManager.getPlaybackState();
    if (shouldAutoPlay) {
      await startPlaylist(playlist);
    } else {
      console.log('Loading new playlist without auto-play');
      await ipcRenderer.invoke('load-playlist', playlist);
    }
    
    deleteOldPlaylists();
    displayPlaylists();
    
    new Notification('Yeni Playlist', {
      body: `${playlist.name} playlist'i başarıyla indirildi.`
    });
  } catch (error) {
    console.error('Error handling new playlist:', error);
  }
});

// Schedule başlatma event'i
ipcRenderer.on('schedule-started', async (event, scheduleData) => {
  try {
    console.log('Schedule started:', scheduleData);
    
    // Mevcut playlist'i durdur
    if (playlistAudio && playlistAudio.playing) {
      playlistAudio.pause();
    }
    
    // Schedule moduna geç
    playbackStateManager.setPlaybackState(true, 'schedule');
    
    // UI'ı güncelle
    UIManager.updateScheduleStatus(true, scheduleData.schedule);
    
    // Schedule şarkısını çal
    if (scheduleData.songs && scheduleData.songs.length > 0) {
      const firstSong = scheduleData.songs[0];
      playlistAudio.src = firstSong.path;
      await playlistAudio.play();
      
      // Şarkı bilgilerini güncelle
      UIManager.updateCurrentSong(firstSong);
      updatePlaybackStatus(true);
    }
  } catch (error) {
    console.error('Error handling schedule start:', error);
  }
});

// Auto-play playlist event'i
ipcRenderer.on('auto-play-playlist', async (event, playlist) => {
  try {
    console.log('Auto-playing playlist:', playlist);
    
    // Schedule aktif değilse playlist'i başlat
    if (playbackStateManager.canStartPlaylist()) {
      await startPlaylist(playlist);
    } else {
      console.log('Cannot auto-play playlist - schedule is active');
    }
  } catch (error) {
    console.error('Error handling auto-play playlist:', error);
  }
});
