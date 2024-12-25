const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const AudioUpdateHandler = require('./services/audio/AudioUpdateHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');

const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);
const audioUpdateHandler = new AudioUpdateHandler(playlistAudio);
const playlistStatus = document.getElementById('playlistStatus');
const loadingSpinner = playlistStatus.querySelector('.loading-spinner');
const statusMessage = playlistStatus.querySelector('.status-message');

// Initialize volume
playlistAudio.volume = 0.7; // 70%

document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
});

// WebSocket bağlantı durumu
ipcRenderer.on('websocket-status', (event, isConnected) => {
    UIManager.updateConnectionStatus(isConnected);
    if (isConnected) {
        const hasPlaylist = store.get('currentPlaylist');
        if (!hasPlaylist) {
            statusMessage.textContent = "Lütfen bir playlist atayın";
            statusMessage.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    }
});

// Playlist indirme durumu
ipcRenderer.on('playlist-download-start', () => {
    statusMessage.style.display = 'none';
    loadingSpinner.style.display = 'flex';
});

ipcRenderer.on('playlist-download-complete', () => {
    playlistStatus.style.display = 'none';
});

// İndirme progress
ipcRenderer.on('download-progress', (event, { songName, progress }) => {
    UIManager.showDownloadProgress(progress, songName);
    if (progress === 100) {
        setTimeout(() => {
            document.querySelector('.download-progress').style.display = 'none';
        }, 1000);
    }
});

// Anons kontrolleri
ipcRenderer.on('play-announcement', async (event, announcement) => {
    console.log('Received announcement:', announcement);
    const success = await AnnouncementAudioService.playAnnouncement(announcement);
    if (!success) {
        console.error('Failed to play announcement');
    }
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
        const initializedPlaylist = PlaylistInitializer.initializePlaylist(playlist);
        
        if (initializedPlaylist) {
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
});

// Şarkı silme mesajını dinle
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing audio handlers');
});
