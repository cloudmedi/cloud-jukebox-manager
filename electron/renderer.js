const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');

const audio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(audio);

// Initialize volume
audio.volume = 0.7; // 70%

// Close button event listener
document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
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

// Anons event listener'larını ekle
ipcRenderer.on('play-announcement', (event, announcement) => {
  console.log('Playing announcement:', announcement);
  
  // Mevcut müziği duraklat
  if (!audio.paused) {
    audio.pause();
  }

  // Anons ses dosyasını yükle ve oynat
  audio.src = announcement.localPath;
  audio.volume = audio.volume; // Mevcut ses seviyesini koru
  
  audio.play().catch(err => {
    console.error('Anons oynatma hatası:', err);
  });

  // Anons bittiğinde playlist'e geri dön
  audio.onended = () => {
    console.log('Announcement ended, resuming playlist');
    const playlists = store.get('playlists', []);
    if (playlists.length > 0) {
      const lastPlaylist = playlists[playlists.length - 1];
      ipcRenderer.invoke('play-playlist', lastPlaylist);
    }
  };
});

ipcRenderer.on('stop-announcement', () => {
  if (!audio.paused) {
    audio.pause();
  }
  // Playlist'e geri dön
  const playlists = store.get('playlists', []);
  if (playlists.length > 0) {
    const lastPlaylist = playlists[playlists.length - 1];
    ipcRenderer.invoke('play-playlist', lastPlaylist);
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
      // Playlist'i yükle ama oynatma
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
  
  new Notification('Yeni Playlist', {
    body: `${playlist.name} playlist'i başarıyla indirildi.`
  });
});

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
    
    // Şarkı değiştiğinde görsel bilgileri güncelle
    displayPlaylists();
  }
});

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, displaying playlists');
  displayPlaylists();
});
