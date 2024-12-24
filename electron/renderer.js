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

// Otomatik playlist başlatma
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
    console.log('Auto-playing playlist:', playlist);
    if (playlist && playlist.songs && playlist.songs.length > 0) {
        const shouldAutoPlay = true; // Her zaman otomatik başlat
        displayPlaylists();
        
        console.log('Should auto-play:', shouldAutoPlay);
        
        if (shouldAutoPlay) {
            console.log('Auto-playing based on saved state');
            playbackStateManager.setCurrentPlaylistId(playlist._id);
            ipcRenderer.invoke('play-playlist', playlist)
                .then(() => {
                    console.log('Playlist started successfully');
                    playbackStateManager.savePlaybackState(true);
                })
                .catch(err => {
                    console.error('Error starting playlist:', err);
                });
        }
    }
});

// Playlistleri göster
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

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, displaying playlists');
    displayPlaylists();
});

// Diğer event listener'lar
