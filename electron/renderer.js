const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const audio = document.getElementById('audioPlayer');

// Initialize volume
audio.volume = 0.7; // 70%

// Playlist listesini göster
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

// Play/Pause toggle
document.getElementById('playButton').addEventListener('click', async () => {
    try {
        const isPlaying = await ipcRenderer.invoke('play-pause');
        updatePlayButton(isPlaying);
    } catch (error) {
        console.error('Play/Pause error:', error);
    }
});

// Previous track
document.getElementById('prevButton').addEventListener('click', async () => {
    console.log('Previous button clicked');
    try {
        const success = await ipcRenderer.invoke('prev-song');
        if (!success) {
            console.log('Could not play previous song');
        }
    } catch (err) {
        console.error('Error invoking prev-song:', err);
    }
});

// Next track
document.getElementById('nextButton').addEventListener('click', async () => {
    console.log('Next button clicked');
    try {
        const success = await ipcRenderer.invoke('next-song');
        if (!success) {
            console.log('Could not play next song');
        }
    } catch (err) {
        console.error('Error invoking next-song:', err);
    }
});

// Progress bar updates
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    
    if (audio.duration > 0 && audio.currentTime >= audio.duration - 0.5) {
        console.log('Song near end, requesting next song');
        ipcRenderer.invoke('next-song').catch(err => {
            console.error('Error invoking next-song near end:', err);
        });
    }
});

// WebSocket mesajlarını dinle
ipcRenderer.on('playlist-received', (event, playlist) => {
    console.log('Playlist received:', playlist);
    displayPlaylists(); // Yeni playlist eklendiğinde listeyi güncelle
});

// İlk yüklemede playlistleri göster
displayPlaylists();