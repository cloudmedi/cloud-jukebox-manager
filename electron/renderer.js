const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');
const PlayerUIService = require('./services/ui/PlayerUIService');

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
    const success = await AnnouncementAudioService.playAnnouncement(announcement);
    if (!success) {
        console.error('Failed to play announcement');
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

// Update player when song changes
ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
    console.log('Updating player with song:', currentSong);
    if (currentSong && currentSong.localPath) {
        const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
        console.log('Playing file from:', normalizedPath);
        
        playlistAudio.src = normalizedPath;
        playlistAudio.play().catch(err => console.error('Playback error:', err));
        
        // UI'ı güncelle
        PlayerUIService.updateSongInfo(currentSong);
        console.log('UI update requested for song:', currentSong.name);
        
        // Playlist display'i güncelle
        displayPlaylists();
    }
});

// Audio event listeners
playlistAudio.addEventListener('ended', () => {
    console.log('Song ended, playing next');
    ipcRenderer.invoke('song-ended');
});

playlistAudio.addEventListener('play', () => {
    console.log('Song started playing');
    const currentSong = store.get('currentSong');
    if (currentSong) {
        PlayerUIService.updateSongInfo(currentSong);
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

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, displaying playlists');
    displayPlaylists();
});