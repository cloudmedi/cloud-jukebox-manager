const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');

const audio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(audio);
const songTitleElement = document.querySelector('.song-title');
const songArtistElement = document.querySelector('.song-artist');

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

// Çalan şarkı bilgilerini güncelle
function updateNowPlaying(song) {
    if (song) {
        songTitleElement.textContent = song.name || 'Bilinmeyen Şarkı';
        songArtistElement.textContent = song.artist || 'Bilinmeyen Sanatçı';
        document.querySelector('.now-playing').style.display = 'block';
    } else {
        document.querySelector('.now-playing').style.display = 'none';
    }
}

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

// Update player event listener
ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
    console.log('Updating player with song:', currentSong);
    if (currentSong && currentSong.localPath) {
        const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
        audio.src = normalizedPath;
        audio.play().catch(err => console.error('Playback error:', err));
        
        // Çalan şarkı bilgilerini güncelle
        updateNowPlaying(currentSong);
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

// Audio event listeners
audio.addEventListener('ended', () => {
    console.log('Song ended, playing next');
    ipcRenderer.invoke('song-ended');
});

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, displaying playlists');
    displayPlaylists();
});