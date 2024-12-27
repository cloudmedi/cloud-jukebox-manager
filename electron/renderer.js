const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');
const NotificationService = require('./services/notification/NotificationService');

const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);

// Initialize volume
playlistAudio.volume = 0.7; // 70%

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
    audioHandler.setVolume(volume);
    ipcRenderer.send('volume-changed', volume);
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
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  if (!playlistContainer) {
    console.error('Playlist container not found');
    return;
  }
  
  playlistContainer.innerHTML = '';
  
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
ipcRenderer.on('playlist-received', (event, playlist) => {
  console.log('New playlist received:', playlist);
  
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
    console.log('Auto-playing new playlist:', playlist);
    ipcRenderer.invoke('play-playlist', playlist);
  } else {
    console.log('Loading new playlist without auto-play');
    ipcRenderer.invoke('load-playlist', playlist);
  }
  
  deleteOldPlaylists();
  displayPlaylists();
  
  NotificationService.showPlaylistNotification(playlist);
});

// Şarkı silme mesajını dinle

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
    
    // UI'ı güncelle
    displayPlaylists();
    
    // Yerel dosyayı sil
    if (removedSong && removedSong.localPath) {
      try {
        fs.unlinkSync(removedSong.localPath);
        console.log('Yerel şarkı dosyası silindi:', removedSong.localPath);
      } catch (error) {
        console.error('Yerel dosya silme hatası:', error);
      }
    }
  } else {
    console.log('Playlist bulunamadı:', playlistId);
  }
});

// Audio event listeners
playlistAudio.addEventListener('ended', () => {
  console.log('Song ended, playing next');
  ipcRenderer.invoke('song-ended');
});

ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
  console.log('Updating player with song:', currentSong);
  if (currentSong && currentSong.localPath) {
    const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
    playlistAudio.src = normalizedPath;
    playlistAudio.play().catch(err => console.error('Playback error:', err));
    
    // Şarkı değiştiğinde görsel bilgileri güncelle
    displayPlaylists();
    
    // Tray menüsünü güncelle
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
    
    console.log('Sent song update to main process:', {
      name: currentSong.name,
      artist: currentSong.artist
    });
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
      NotificationService.showSuccessNotification(toast.message);
      break;
    case 'error':
      NotificationService.showErrorNotification(toast.message);
      break;
    case 'loading':
      NotificationService.showLoadingNotification(toast.message);
      break;
  }
});
