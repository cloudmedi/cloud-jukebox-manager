const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const audio = document.getElementById('audioPlayer');

// Initialize volume
audio.volume = 0.7; // 70%

function displayPlaylists() {
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  playlistContainer.innerHTML = '';
  
  playlists.forEach(playlist => {
    const playlistElement = document.createElement('div');
    playlistElement.className = 'playlist-item';
    playlistElement.innerHTML = `
      <div class="playlist-info">
        ${playlist.artwork ? 
          `<img src="${playlist.artwork}" alt="${playlist.name}" class="playlist-artwork"/>` :
          '<div class="playlist-artwork-placeholder"></div>'
        }
        <div class="playlist-details">
          <h3>${playlist.name}</h3>
          <p>${playlist.songs.length} şarkı</p>
        </div>
      </div>
    `;
    
    playlistElement.addEventListener('click', () => {
      console.log('Playing playlist:', playlist);
      ipcRenderer.invoke('play-playlist', playlist);
    });
    
    playlistContainer.appendChild(playlistElement);
  });
}

// WebSocket mesaj dinleyicileri
ipcRenderer.on('playlist-received', (event, playlist) => {
  console.log('New playlist received:', playlist);
  
  // Mevcut playlistleri al
  const playlists = store.get('playlists', []);
  
  // Eğer playlist zaten varsa güncelle, yoksa ekle
  const existingIndex = playlists.findIndex(p => p._id === playlist._id);
  if (existingIndex !== -1) {
    playlists[existingIndex] = playlist;
  } else {
    playlists.push(playlist);
  }
  
  // Store'u güncelle
  store.set('playlists', playlists);
  
  // UI'ı hemen güncelle
  displayPlaylists();
  
  // Yeni playlist'i hemen çal
  console.log('Auto-playing new playlist:', playlist);
  ipcRenderer.invoke('play-playlist', playlist);
  
  // Bildirim göster
  new Notification('Yeni Playlist', {
    body: `${playlist.name} playlist'i başarıyla indirildi ve çalınıyor.`
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
  }
});

ipcRenderer.on('toggle-playback', () => {
  if (audio.paused) {
    audio.play().catch(err => console.error('Play error:', err));
  } else {
    audio.pause();
  }
});

// Play/Pause toggle
document.getElementById('playButton').addEventListener('click', () => {
  ipcRenderer.invoke('play-pause');
});

// Previous track
document.getElementById('prevButton').addEventListener('click', () => {
  ipcRenderer.invoke('prev-song');
});

// Next track
document.getElementById('nextButton').addEventListener('click', () => {
  ipcRenderer.invoke('next-song');
});

// Progress bar updates
audio.addEventListener('timeupdate', () => {
  const progress = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progressBar').style.width = progress + '%';
});

// İlk yüklemede playlistleri göster
displayPlaylists();