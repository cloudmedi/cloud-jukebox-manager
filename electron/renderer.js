const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const deviceService = require('./services/deviceService');

const audio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(audio);

// Initialize volume
audio.volume = 0.7; // 70%

// Playback control events
ipcRenderer.on('stop-playback', () => {
  console.log('Stopping playback...');
  if (audio) {
    audio.pause();
    audio.src = '';
    console.log('Playback stopped successfully');
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

// Notification handler
ipcRenderer.on('show-notification', (event, { title, body }) => {
  console.log('Showing notification:', { title, body });
  new Notification(title, { body });
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

// WebSocket mesaj dinleyicileri
ipcRenderer.on('websocket-message', async (event, message) => {
  console.log('WebSocket message received:', message);

  switch (message.type) {
    case 'command':
      if (message.command === 'shutdown') {
        // Kullanıcıya bilgi ver
        new Notification('Cihaz Silindi', {
          body: 'Bu cihaz sistemden silindi. Uygulama kapatılıyor.'
        });

        // Yerel dosyaları temizle
        await deviceService.cleanupLocalFiles();

        // 3 saniye sonra uygulamayı kapat
        setTimeout(() => {
          ipcRenderer.send('quit-app');
        }, 3000);
      }
      break;

    case 'playlist':
      console.log('New playlist received:', message.data);
      const playlists = store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === message.data._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = message.data;
      } else {
        playlists.push(message.data);
      }
      
      store.set('playlists', playlists);
      
      const shouldAutoPlay = playbackStateManager.getPlaybackState();
      if (shouldAutoPlay) {
        console.log('Auto-playing new playlist:', message.data);
        ipcRenderer.invoke('play-playlist', message.data);
      } else {
        console.log('Loading new playlist without auto-play');
        ipcRenderer.invoke('load-playlist', message.data);
      }
      
      deleteOldPlaylists();
      displayPlaylists();
      
      new Notification('Yeni Playlist', {
        body: `${message.data.name} playlist'i başarıyla indirildi.`
      });
      break;
  }
});

// Otomatik playlist başlatma
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
  console.log('Auto-playing playlist:', playlist);
  if (playlist && playlist.songs && playlist.songs.length > 0) {
    const shouldAutoPlay = playbackStateManager.getPlaybackState();
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

function displayPlaylists() {
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  if (!playlistContainer) {
    console.error('Playlist container not found');
    return;
  }
  
  playlistContainer.innerHTML = '';
  
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
  
  if (playlists.length > 1) {
    const latestPlaylist = playlists[playlists.length - 1];
    
    playlists.slice(0, -1).forEach(playlist => {
      playlist.songs.forEach(song => {
        if (song.localPath) {
          try {
            fs.unlinkSync(song.localPath);
            console.log(`Deleted song file: ${song.localPath}`);
            
            const playlistDir = path.dirname(song.localPath);
            
            const files = fs.readdirSync(playlistDir);
            files.forEach(file => {
              const filePath = path.join(playlistDir, file);
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
            });
            
            fs.rmdirSync(playlistDir);
            console.log(`Deleted playlist directory: ${playlistDir}`);
          } catch (error) {
            console.error(`Error deleting files/directory: ${error}`);
          }
        }
      });
    });
    
    store.set('playlists', [latestPlaylist]);
    console.log('Kept only the latest playlist:', latestPlaylist.name);
  }
}

// Audio event listeners
audio.addEventListener('ended', () => {
  console.log('Song ended, playing next');
  ipcRenderer.invoke('song-ended');
});

ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
  console.log('Updating player with song:', currentSong);
  if (currentSong && currentSong.localPath) {
    const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
    audio.src = normalizedPath;
    audio.play().catch(err => console.error('Playback error:', err));
    
    displayPlaylists();
  }
});

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, displaying playlists');
  displayPlaylists();
});
