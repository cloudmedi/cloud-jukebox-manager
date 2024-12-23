const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const audio = document.getElementById('audioPlayer');

// Initialize volume
audio.volume = 0.7;

// Format time helper function
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update UI elements
function updatePlayerUI(playlist, currentSong) {
    const playlistName = document.getElementById('playlistName');
    const currentSongElement = document.getElementById('currentSong');
    const artworkPlaceholder = document.getElementById('artworkPlaceholder');
    const playPauseButton = document.getElementById('playPauseButton');

    if (playlist && currentSong) {
        playlistName.textContent = playlist.name;
        currentSongElement.textContent = currentSong.name;

        // Update artwork if available
        if (currentSong.artwork) {
            artworkPlaceholder.innerHTML = `<img src="${currentSong.artwork}" alt="${currentSong.name}" class="artwork-image">`;
        } else {
            artworkPlaceholder.innerHTML = '<i class="fas fa-music"></i>';
        }

        // Update play/pause button icon
        playPauseButton.innerHTML = audio.paused ? 
            '<i class="fas fa-play"></i>' : 
            '<i class="fas fa-pause"></i>';
    }
}

// Otomatik playlist başlatma
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
    console.log('Auto-playing playlist:', playlist);
    if (playlist && playlist.songs && playlist.songs.length > 0) {
        ipcRenderer.invoke('play-playlist', playlist);
    }
});

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
                    '<div class="playlist-artwork-placeholder"><i class="fas fa-music"></i></div>'
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

// Audio event listeners
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    const progress = (currentTime / duration) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Update time display
    document.getElementById('currentTime').textContent = formatTime(currentTime);
    document.getElementById('duration').textContent = formatTime(duration || 0);
});

audio.addEventListener('ended', () => {
    console.log('Song ended, playing next');
    ipcRenderer.invoke('song-ended');
});

// Player controls
document.getElementById('playPauseButton').addEventListener('click', () => {
    ipcRenderer.invoke('play-pause');
});

document.getElementById('prevButton').addEventListener('click', () => {
    ipcRenderer.invoke('prev-song');
});

document.getElementById('nextButton').addEventListener('click', () => {
    ipcRenderer.invoke('next-song');
});

// WebSocket message listeners
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
    console.log('Auto-playing new playlist:', playlist);
    ipcRenderer.invoke('play-playlist', playlist);
    
    displayPlaylists();
    
    new Notification('Yeni Playlist', {
        body: `${playlist.name} playlist'i başarıyla indirildi ve çalınıyor.`
    });
});

ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
    console.log('Updating player with song:', currentSong);
    if (currentSong && currentSong.localPath) {
        const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
        audio.src = normalizedPath;
        audio.play().catch(err => console.error('Playback error:', err));
        updatePlayerUI(playlist, currentSong);
    }
});

ipcRenderer.on('toggle-playback', () => {
    if (audio.paused) {
        audio.play().catch(err => console.error('Play error:', err));
    } else {
        audio.pause();
    }
    updatePlayerUI(null, null);
});

// İlk yüklemede playlistleri göster
displayPlaylists();