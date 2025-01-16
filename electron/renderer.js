const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

// Controller'ları ve servisleri import et
const scheduleController = new (require('./services/schedule/ScheduleController'))();
const playlistController = require('./services/playlist/PlaylistController');
const JukeboxPlayer = require('./services/audio/JukeboxPlayer');
const announcementHandler = require('./services/announcement/AnnouncementHandler');
const ArtworkManager = require('./services/ui/ArtworkManager');

// UI manager'ları import et
const UIManager = require('./services/ui/UIManager');
const PlayerUIManager = require('./services/ui/PlayerUIManager');

// State manager'ları import et
const playbackStateManager = {
    setPlaybackState: (isPlaying, type = 'playlist') => {
        store.set('playbackState', {
            isPlaying,
            type,
            timestamp: new Date().toISOString()
        });
    },
    
    getPlaybackState: () => {
        return store.get('playbackState');
    },
    
    savePlaybackState: (wasPlaying, volume = 0.7) => {
        store.set('playbackState', {
            wasPlaying,
            volume,
            timestamp: new Date().toISOString()
        });
    }
};

// Badge durumunu güncelleme fonksiyonu
function updatePlaybackBadge(state) {
    const playbackBadge = document.getElementById('playbackBadge');
    if (!playbackBadge) return;

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
function updatePlaybackStatus(isPlaying, type = 'playlist') {
    try {
        // Badge'i güncelle
        updatePlaybackBadge(isPlaying ? 'playing' : 'paused');
        
        // WebSocket üzerinden durumu gönder
        ipcRenderer.invoke('send-websocket-message', {
            type: 'playbackStatus',
            data: {
                isPlaying,
                timestamp: new Date().toISOString()
            }
        });
        
        // Tray menüsünü güncelle
        ipcRenderer.send('playback-status-changed', isPlaying);
    } catch (error) {
        console.error('Error updating playback status:', error);
    }
}

// Ses yönetimi için tek instance
const jukeboxPlayer = new JukeboxPlayer();

// Event listener'ları ayarla
jukeboxPlayer.setOnSongEndCallback(() => {
    ipcRenderer.invoke('song-ended');
});

jukeboxPlayer.setOnPlaybackChangeCallback((isPlaying) => {
    updatePlaybackStatus(isPlaying);
});

// IPC event listeners
ipcRenderer.on('play-announcement', async (event, { url }) => {
    await jukeboxPlayer.playAnnouncement(url);
});

ipcRenderer.on('play-schedule', async (event, { url }) => {
    await jukeboxPlayer.playSchedule(url);
});

ipcRenderer.on('stop-schedule', async () => {
    await jukeboxPlayer.stopSchedule();
});

ipcRenderer.on('playback-status-update', (event, status) => {
    try {
        console.log('Playback status update:', status);
        updatePlaybackStatus(status.isPlaying);
        
        // UI'ı güncelle
        const nowPlayingElement = document.getElementById('nowPlaying');
        const artistElement = document.getElementById('artist');
        
        if (status.currentSong) {
            nowPlayingElement.textContent = status.currentSong.name || '';
            artistElement.textContent = status.currentSong.artist || '';
        } else {
            nowPlayingElement.textContent = '';
            artistElement.textContent = '';
        }
    } catch (error) {
        console.error('Error handling playback status update:', error);
    }
});

ipcRenderer.on('playback-command', async (event, data) => {
    try {
        console.log('Playback command received:', data);
        const { action } = data;

        if (action === 'pause') {
            jukeboxPlayer.pause();
        } else if (action === 'play') {
            jukeboxPlayer.resume();
        }
    } catch (error) {
        console.error('Error handling playback command:', error);
    }
});

ipcRenderer.on('volume-command', (event, data) => {
    try {
        const { volume } = data;
        jukeboxPlayer.setVolume(volume);
    } catch (error) {
        console.error('Error handling volume command:', error);
    }
});

ipcRenderer.on('load-playlist', async (event, data) => {
    try {
        const { playlist } = data;
        jukeboxPlayer.loadPlaylist(playlist);
    } catch (error) {
        console.error('Error loading playlist:', error);
    }
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Başlangıç durumunu ayarla
        updatePlaybackBadge('paused');
        
        // Emergency durumunu kontrol et
        const emergencyState = store.get('emergencyState');
        if (emergencyState && emergencyState.isActive) {
            console.log('Emergency state is active on startup');
            jukeboxPlayer.pause();
            jukeboxPlayer.setVolume(0);
            showEmergencyMessage();
        }
        
        // Mevcut playlist'leri göster
        await displayPlaylists();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Schedule event'lerini dinle
ipcRenderer.on('schedule-started', async (event, scheduleData) => {
    console.log('Schedule started:', scheduleData);
    
    // Mevcut playlist'i durdur
    jukeboxPlayer.pause();
    
    // Schedule moduna geç
    scheduleController.startSchedule(scheduleData);
    
    // Schedule şarkısını çal
    if (scheduleData.songs && scheduleData.songs.length > 0) {
        const firstSong = scheduleData.songs[0];
        jukeboxPlayer.loadPlaylist({
            songs: scheduleData.songs,
            id: 'schedule-' + Date.now()
        });
    }
});

ipcRenderer.on('schedule-ended', () => {
    console.log('Schedule ended');
    
    // Schedule modundan çık
    scheduleController.endSchedule();
    
    // Normal playlist'e geri dön
    const currentPlaylist = store.get('currentPlaylist');
    if (currentPlaylist) {
        jukeboxPlayer.loadPlaylist(currentPlaylist);
    }
});

// Emergency stop handler
ipcRenderer.on('emergency-stop', () => {
    console.log('Emergency stop received');
    
    // Tüm ses çalmayı durdur
    jukeboxPlayer.pause();
    jukeboxPlayer.setVolume(0);

    // Anons sesini durdur
    announcementHandler.stopAnnouncement();
    
    // Emergency durumunu kaydet
    store.set('emergencyState', {
        isActive: true,
        timestamp: new Date().toISOString()
    });
    
    // UI'ı güncelle
    showEmergencyMessage();
});

// Emergency reset handler
ipcRenderer.on('emergency-reset', () => {
    console.log('Emergency reset received');
    
    // Emergency durumunu temizle
    store.delete('emergencyState');
    
    // UI'ı güncelle
    hideEmergencyMessage();
    
    // Önceki playback durumunu kontrol et
    const playbackState = store.get('playbackState');
    if (playbackState && playbackState.wasPlaying) {
        console.log('Resuming playback after emergency reset');
        jukeboxPlayer.setVolume(playbackState.volume || 0.7);
        jukeboxPlayer.resume();
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
    try {
        console.log('Received announcement:', announcement);
        
        // Mevcut müziği duraklat
        jukeboxPlayer.pause();
        
        // Anonsu çal
        await announcementHandler.handleAnnouncement(announcement);
    } catch (error) {
        console.error('Error playing announcement:', error);
    }
});

ipcRenderer.on('announcement-ended', () => {
    try {
        // Müziği devam ettir
        jukeboxPlayer.resume();
    } catch (error) {
        console.error('Error resuming playback:', error);
    }
});

ipcRenderer.on('pause-playback', () => {
  if (jukeboxPlayer && !jukeboxPlayer.paused) {
    jukeboxPlayer.pause();
  }
});

ipcRenderer.on('resume-playback', () => {
  if (jukeboxPlayer && jukeboxPlayer.paused) {
    jukeboxPlayer.play().catch(err => console.error('Resume playback error:', err));
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
    if (jukeboxPlayer) {
        jukeboxPlayer.setVolume(volume);
    }
});

// Restart playback from WebSocket
ipcRenderer.on('restart-playback', () => {
  console.log('Restarting playback');
  if (jukeboxPlayer) {
    jukeboxPlayer.currentTime = 0;
    jukeboxPlayer.play().catch(err => console.error('Playback error:', err));
  }
});

// Toggle playback from WebSocket
ipcRenderer.on('toggle-playback', () => {
  console.log('Toggle playback, current state:', jukeboxPlayer.paused);
  if (jukeboxPlayer) {
    if (jukeboxPlayer.paused) {
      jukeboxPlayer.play()
        .then(() => {
          console.log('Playback started successfully');
          playbackStateManager.savePlaybackState(true);
          ipcRenderer.send('playback-status-changed', true);
          // WebSocket üzerinden oynatma durumunu gönder
          ipcRenderer.invoke('send-websocket-message', {
            type: 'deviceStatus',
            isPlaying: true
          });
        })
        .catch(err => {
          console.error('Playback error:', err);
          ipcRenderer.send('playback-status-changed', false);
        });
    } else {
      jukeboxPlayer.pause();
      console.log('Playback paused');
      playbackStateManager.savePlaybackState(false);
      ipcRenderer.send('playback-status-changed', false);
      // WebSocket üzerinden duraklatma durumunu gönder
      ipcRenderer.invoke('send-websocket-message', {
        type: 'deviceStatus',
        isPlaying: false
      });
    }
  }
});

// Playback komutlarını dinle
ipcRenderer.on('playback-command', async (event, data) => {
  try {
    console.log('Playback command received:', data);
    const { action } = data;

    if (action === 'pause') {
      jukeboxPlayer.pause();
    } else if (action === 'play') {
      jukeboxPlayer.play();
    }
  } catch (error) {
    console.error('Error handling playback command:', error);
  }
});

// Volume komutlarını dinle
ipcRenderer.on('volume-command', (event, data) => {
  try {
    const { volume } = data;
    jukeboxPlayer.setVolume(volume);
  } catch (error) {
    console.error('Error handling volume command:', error);
  }
});

// WebSocket mesaj dinleyicileri
ipcRenderer.on('websocket-message', (event, message) => {
  console.log('Sending WebSocket message:', message);
  ipcRenderer.invoke('send-websocket-message', message);
});

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

    // Artwork'ü indir
    if (playlist.artwork) {
      console.log('Downloading artwork for playlist:', playlist.name);
      const artworkUrl = playlist.baseUrl + playlist.artwork;
      await ArtworkManager.loadArtwork(artworkUrl, playlist._id);
      
      // Playlist'in artwork path'ini güncelle
      playlist.artwork = path.join(process.env.APPDATA, 'cloud-media-player', 'downloads', playlist._id, 'artwork', 'artwork.jpg');
      store.set('playlists', playlists);
    }
    
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
        if (jukeboxPlayer) {
          jukeboxPlayer.src = data.song.url;
          const canStart = await checkAndStartPlaylist();
          if (canStart) {
            await jukeboxPlayer.play();
          }
        }
        updateNowPlaying(data.song);
      }
      break;
    case 'stop':
      if (jukeboxPlayer) {
        jukeboxPlayer.pause();
        jukeboxPlayer.currentTime = 0;
      }
      break;
    case 'update':
      if (data.playlists) {
        displayPlaylists(data.playlists);
      }
      break;
  }
}

// Update the delete message handler
ipcRenderer.on('device-deleted', (event, id) => {
  console.log('Device deleted, cleaning up...');
  
  // Stop any playing audio
  if (jukeboxPlayer) {
    jukeboxPlayer.pause();
    jukeboxPlayer.src = '';
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
    console.log('Update Player Event Received:', { playlist, currentSong });
    
    if (currentSong && currentSong.localPath) {
        console.log('Current Song Data:', {
            name: currentSong.name,
            artist: currentSong.artist,
            localPath: currentSong.localPath
        });
        
        const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
        console.log('Setting audio source to:', normalizedPath);
        
        jukeboxPlayer.src = normalizedPath;
        jukeboxPlayer.play().catch(err => console.error('Playback error:', err));
        
        // UI'ı güncelle
        const nowPlayingElement = document.getElementById('nowPlaying');
        const artistElement = document.getElementById('artist');
        
        if (nowPlayingElement) {
            nowPlayingElement.textContent = currentSong.name || '';
        }
        if (artistElement) {
            artistElement.textContent = currentSong.artist || '';
        }
    } else {
        console.warn('Invalid song data received:', currentSong);
    }
});

// Playlist yükleme event'i
ipcRenderer.on('playlist-loaded', async (event, playlist) => {
    try {
        console.log('Playlist loaded:', playlist);
        
        // UI'ı güncelle
        const container = document.getElementById('playlistContainer');
        if (!container) {
            console.error('Playlist container not found');
            return;
        }

        // Playlist HTML'ini oluştur
        const html = playlist.songs.map((song, index) => `
            <div class="playlist-item" data-index="${index}">
                <div class="playlist-info">
                    <div class="playlist-artwork-placeholder"></div>
                    <div class="playlist-details">
                        <h3>${song.name || 'Unknown Song'}</h3>
                        <p>${song.artist || 'Unknown Artist'}</p>
                    </div>
                </div>
            </div>
        `).join('');

        // HTML'i container'a ekle
        container.innerHTML = html;

        // Status badge'i güncelle
        const badge = document.getElementById('playbackBadge');
        if (badge) {
            badge.className = 'status-badge ' + (playlist.songs.length > 0 ? 'paused' : 'no-playlist');
        }

        // Download progress'i gizle
        const progressBar = document.querySelector('.download-progress');
        if (progressBar) {
            progressBar.style.display = 'none';
        }

    } catch (error) {
        console.error('Error handling playlist loaded:', error);
        showError('Error loading playlist: ' + error.message);
    }
});

// Error gösterme fonksiyonu
function showError(message) {
    const container = document.getElementById('errorContainer');
    if (!container) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    container.appendChild(errorDiv);

    // 5 saniye sonra error mesajını kaldır
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Playlist'leri görüntüle
async function displayPlaylists() {
    try {
        const playlists = store.get('playlists', []);
        if (!playlists || playlists.length === 0) {
            UIManager.showError('No playlists available');
            return;
        }

        // Son playlist'i göster
        const lastPlaylist = playlists[playlists.length - 1];
        if (lastPlaylist) {
            // Artwork path'ini düzelt
            if (lastPlaylist.artwork) {
                // Eğer tam yol değilse, oluştur
                if (!lastPlaylist.artwork.includes(process.env.APPDATA)) {
                    lastPlaylist.artwork = path.join(
                        process.env.APPDATA,
                        'cloud-media-player',
                        'downloads',
                        lastPlaylist._id,
                        'artwork',
                        'artwork.jpg'
                    );
                    // Store'u güncelle
                    store.set('playlists', playlists);
                }
            }

            // Sadece UI'ı güncelle, playback başlatma
            UIManager.displayPlaylists(lastPlaylist);
            
            // Playlist'teki şarkılar için artwork'leri yükle
            if (lastPlaylist.songs) {
                lastPlaylist.songs.forEach(song => {
                    if (song.artworkPath) {
                        // Şarkı artwork path'ini de düzelt
                        if (!song.artworkPath.includes(process.env.APPDATA)) {
                            song.artworkPath = path.join(
                                process.env.APPDATA,
                                'cloud-media-player',
                                'downloads',
                                lastPlaylist._id,
                                'artwork',
                                path.basename(song.artworkPath)
                            );
                        }
                        ArtworkManager.loadArtwork(song.artworkPath);
                    }
                });
            }
        }

        // Aktif playlist'i kaydet
        store.set('currentPlaylist', lastPlaylist);

        // Eğer auto-play aktifse, playlist'i başlat
        const shouldAutoPlay = playbackStateManager.getPlaybackState();
        if (shouldAutoPlay && lastPlaylist && !jukeboxPlayer.isPlaying) {
            console.log('Auto-playing last playlist');
            await startPlaylist(lastPlaylist);
        }
    } catch (error) {
        console.error('Error displaying playlists:', error);
        UIManager.showError('Failed to display playlists');
    }
}

// Auto-play playlist event'i
ipcRenderer.on('auto-play-playlist', async (event, playlist) => {
    try {
        // Eğer zaten çalıyorsa, yeni playlist'i başlatma
        if (jukeboxPlayer.isPlaying) {
            console.log('Player is already playing, skipping auto-play');
            return;
        }

        console.log('Auto-playing playlist:', {
            name: playlist.name,
            songCount: playlist.songs.length,
            firstSong: playlist.songs[0]
        });
        
        // Playlist'i yükle ve çal
        const loadResult = await jukeboxPlayer.loadPlaylist(playlist);
        console.log('Playlist load result:', loadResult);
        
        if (loadResult) {
            // UI'ı güncelle
            UIManager.displayPlaylists(playlist);
            
            // Artwork'leri yükle
            if (playlist.songs) {
                playlist.songs.forEach(song => {
                    if (song.artworkPath) {
                        ArtworkManager.loadArtwork(song.artworkPath);
                    }
                });
            }
            
            // Playback durumunu güncelle
            playbackStateManager.setPlaybackState(true);
        } else {
            console.error('Failed to load playlist');
            UIManager.showError('Failed to load playlist');
        }
    } catch (error) {
        console.error('Error handling auto-play playlist:', error);
        UIManager.showError('Failed to auto-play playlist');
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
    
    // Direkt JukeboxPlayer'ı kullan
    const result = await jukeboxPlayer.loadPlaylist(playlist);
    
    if (!result) {
      console.error('Failed to start playlist');
      new Notification('Playlist Error', {
        body: 'Failed to start playlist'
      });
      return;
    }

    // Playlist başarıyla başlatıldı
    console.log('Playlist started successfully');
    
    // UI'ı güncelle
    playbackStateManager.setPlaybackState(true);
    
  } catch (error) {
    console.error('Error starting playlist:', error);
    new Notification('Playlist Error', {
      body: error.message
    });
  }
}

// Eski playlistleri sil
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
            console.log('Deleted song file:', song.localPath);
            
            // Şarkının bulunduğu klasörü bul
            const playlistDir = path.dirname(song.localPath);
            
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
      });
    });
    
    // Store'u güncelle, sadece son playlisti tut
    store.set('playlists', [latestPlaylist]);
    console.log('Kept only the latest playlist:', latestPlaylist.name);
  }
}

// Son durum güncellemesi için değişkenler
let lastPlaybackUpdate = null;
let lastDeviceUpdate = null;
const UPDATE_THROTTLE = 1000; // 1 saniye

// Playback durumu güncelleme
ipcRenderer.on('playback-status-update', (event, data) => {
  const now = Date.now();
  
  // Son güncellemeden beri yeterli zaman geçmediyse güncelleme yapma
  if (lastPlaybackUpdate && (now - lastPlaybackUpdate) < UPDATE_THROTTLE) {
    return;
  }
  
  console.log('Playback status update:', data);
  updatePlaybackStatus(data.isPlaying, data.playerType);
  lastPlaybackUpdate = now;
});

// Device durumu güncelleme
ipcRenderer.on('device-status-update', (event, data) => {
  const now = Date.now();
  
  // Son güncellemeden beri yeterli zaman geçmediyse güncelleme yapma
  if (lastDeviceUpdate && (now - lastDeviceUpdate) < UPDATE_THROTTLE) {
    return;
  }
  
  console.log('Device status update:', data);
  updatePlaybackStatus(data.isPlaying);
  lastDeviceUpdate = now;
});

// Schedule başlatma event'i
ipcRenderer.on('schedule-started', async (event, scheduleData) => {
  try {
    console.log('Schedule started:', scheduleData);
    
    // Mevcut playlist'i durdur
    if (jukeboxPlayer && jukeboxPlayer.playing) {
      jukeboxPlayer.pause();
    }
    
    // Schedule moduna geç
    playbackStateManager.setPlaybackState(true, 'schedule');
    
    // UI'ı güncelle
    UIManager.updateScheduleStatus(true, scheduleData.schedule);
    
    // Schedule şarkısını çal
    if (scheduleData.songs && scheduleData.songs.length > 0) {
      const firstSong = scheduleData.songs[0];
      jukeboxPlayer.src = firstSong.path;
      await jukeboxPlayer.play();
      
      // Şarkı bilgilerini güncelle
      UIManager.updateCurrentSong(firstSong);
      updatePlaybackStatus(true);
    }
  } catch (error) {
    console.error('Error handling schedule start:', error);
  }
});

// Now playing bilgilerini güncelle
ipcRenderer.on('update-now-playing', (event, data) => {
  try {
    console.log('Now playing update:', data);
    
    // UI'ı güncelle
    const nowPlayingElement = document.getElementById('nowPlaying');
    const artistElement = document.getElementById('artist');
    
    if (data.songName) {
      nowPlayingElement.textContent = data.songName;
      artistElement.textContent = data.artist || '';
      
      // Player tipine göre ek bilgi ekle
      if (data.playerType === 'schedule') {
        nowPlayingElement.textContent += ' (Takvim)';
      }
    } else {
      nowPlayingElement.textContent = '';
      artistElement.textContent = '';
    }
  } catch (error) {
    console.error('Error updating now playing info:', error);
  }
});

// Playback komutlarını gönder
function sendPlaybackCommand(action) {
  ipcRenderer.send('playback-command', { action });
}

// Volume komutlarını gönder
function sendVolumeCommand(volume) {
  ipcRenderer.send('volume-command', { volume: parseFloat(volume) });
}

// Playback durumunu güncelle
ipcRenderer.on('playback-status-changed', (event, isPlaying) => {
  const playButton = document.getElementById('playButton');
  const pauseButton = document.getElementById('pauseButton');
  
  if (isPlaying) {
    playButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
  } else {
    playButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
  }
});

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

// Test için seek event listener'ı
document.addEventListener('keydown', (event) => {
    if (event.key === 'F9') {  // F9 tuşuna basınca son 6 saniyeye gidecek
        jukeboxPlayer.seekToEnd();
    }
});
