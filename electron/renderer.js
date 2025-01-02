const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');
const PlayerUIManager = require('./services/ui/PlayerUIManager');
const VolumeManager = require('./services/audio/VolumeManager');
const ArtworkManager = require('./services/ui/ArtworkManager');
const ScreenshotEventHandler = require('./services/screenshot/ScreenshotEventHandler');
const DownloadStateManager = require('./services/download/DownloadStateManager');

const store = new Store();

// Audio elements
const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);
const playbackBadge = document.getElementById('playbackBadge');

// Initialize download state manager
const downloadStateManager = new DownloadStateManager();

// Badge durumunu güncelleme fonksiyonu
function updatePlaybackBadge(state) {
    if (!playbackBadge) return;
    
    playbackBadge.className = 'status-badge';
    
    if (!store.get('playlists') || store.get('playlists').length === 0) {
        playbackBadge.classList.add('no-playlist');
        return;
    }

    if (state === 'playing') {
        playbackBadge.classList.add('playing');
    } else {
        playbackBadge.classList.add('paused');
    }
}

// Audio event listeners
if (playlistAudio) {
    playlistAudio.addEventListener('play', () => {
        console.log('Audio started playing');
        updatePlaybackBadge('playing');
    });

    playlistAudio.addEventListener('pause', () => {
        console.log('Audio paused');
        updatePlaybackBadge('paused');
    });

    playlistAudio.addEventListener('ended', () => {
        console.log('Song ended, playing next');
        ipcRenderer.invoke('song-ended');
    });
}

// İlk yüklemede badge durumunu ayarla
document.addEventListener('DOMContentLoaded', () => {
    const playlists = store.get('playlists', []);
    if (!playlists || playlists.length === 0) {
        updatePlaybackBadge('no-playlist');
    } else {
        updatePlaybackBadge(playlistAudio?.paused ? 'paused' : 'playing');
    }
    
    // Display playlists
    displayPlaylists();
});

// WebSocket message handlers
ipcRenderer.on('playlist-received', async (event, playlist) => {
    console.log('New playlist received:', playlist);
    
    try {
        // Save playlist to store
        const playlists = store.get('playlists', []);
        const existingIndex = playlists.findIndex(p => p._id === playlist._id);
        
        if (existingIndex !== -1) {
            playlists[existingIndex] = playlist;
        } else {
            playlists.push(playlist);
        }
        
        store.set('playlists', playlists);
        
        // Initialize download state
        await downloadStateManager.initializePlaylistDownload(playlist);
        
        // Start playback if needed
        const shouldAutoPlay = playbackStateManager.getPlaybackState();
        if (shouldAutoPlay) {
            console.log('Auto-playing new playlist:', playlist);
            ipcRenderer.invoke('play-playlist', playlist);
        } else {
            console.log('Loading new playlist without auto-play');
            ipcRenderer.invoke('load-playlist', playlist);
        }
        
        // Update UI
        displayPlaylists();
        
        // Show notification
        new Notification('Yeni Playlist', {
            body: `${playlist.name} playlist'i başarıyla indirildi.`
        });
    } catch (error) {
        console.error('Error handling playlist:', error);
        // Show error notification
        new Notification('Hata', {
            body: `Playlist yüklenirken bir hata oluştu: ${error.message}`
        });
    }
});

// Emergency stop handler
ipcRenderer.on('emergency-stop', () => {
    console.log('Emergency stop received');
    
    // Tüm ses çalmayı durdur
    if (playlistAudio) {
        playlistAudio.pause();
        playlistAudio.currentTime = 0;
        playlistAudio.volume = 0;
    }

    // Anons sesini durdur
    const campaignAudio = document.getElementById('campaignPlayer');
    if (campaignAudio) {
        campaignAudio.pause();
        campaignAudio.currentTime = 0;
        campaignAudio.volume = 0;
    }

    // Store'u güncelle
    store.set('playbackState', {
        isPlaying: false,
        emergencyStopped: true
    });

    // UI'ı güncelle
    showEmergencyMessage();
});

// Emergency reset handler
ipcRenderer.on('emergency-reset', () => {
    console.log('Emergency reset received');
    hideEmergencyMessage();
    
    // Resume playback if it was playing before emergency
    const playbackState = store.get('playbackState');
    if (playbackState && playbackState.wasPlaying) {
        console.log('Resuming playback after emergency reset');
        const playlistAudio = document.getElementById('audioPlayer');
        if (playlistAudio) {
            playlistAudio.volume = playbackState.volume || 0.7;
            playlistAudio.play().catch(err => console.error('Resume playback error:', err));
        }
    }
});

// Emergency message handlers
ipcRenderer.on('show-emergency-message', (event, data) => {
    showEmergencyMessage(data.title, data.message);
});

ipcRenderer.on('hide-emergency-message', () => {
    hideEmergencyMessage();
});

function showEmergencyMessage(title = 'Acil Durum Aktif', message = 'Müzik yayını geçici olarak durdurulmuştur.') {
    const container = document.createElement('div');
    container.id = 'emergency-message';
    container.className = 'emergency-banner';
    container.innerHTML = `
        <h3 class="emergency-title">${title}</h3>
        <p class="emergency-text">${message}</p>
    `;
    
    // Find the playlist container and append the emergency message at the bottom
    const playlistContainer = document.querySelector('.playlist-container');
    if (playlistContainer) {
        playlistContainer.appendChild(container);
    } else {
        document.body.appendChild(container);
    }
}

function hideEmergencyMessage() {
    const container = document.getElementById('emergency-message');
    if (container) {
        container.remove();
    }
}

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
    // Volume değerini kaydet ve normalize et
    const savedVolume = VolumeManager.saveVolume(volume);
    const normalizedVolume = VolumeManager.normalizeVolume(savedVolume);
    
    // Audio player'a uygula
    playlistAudio.volume = normalizedVolume;
    
    // Volume değişikliğini bildir
    ipcRenderer.send('volume-changed', savedVolume);
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
    console.log('=== PLAYLIST DISPLAY DEBUG LOGS ===');
    const playlists = store.get('playlists', []);
    const playlistContainer = document.getElementById('playlistContainer');
    
    if (!playlistContainer) {
        console.error('Playlist container not found');
        return;
    }
    
    console.log('Current playlists in store:', playlists);
    
    playlistContainer.innerHTML = '';
    
    // Son playlist'i göster
    const lastPlaylist = playlists[playlists.length - 1];
    if (lastPlaylist) {
        const playlistElement = document.createElement('div');
        playlistElement.className = 'playlist-item';
        
        const artworkHtml = ArtworkManager.createArtworkHtml(lastPlaylist.artwork, lastPlaylist.name);
        
        playlistElement.innerHTML = `
            <div class="playlist-info">
                ${artworkHtml}
                <div class="playlist-details">
                    <h3>${lastPlaylist.name}</h3>
                    <p>${lastPlaylist.songs[0]?.artist || 'Unknown Artist'}</p>
                    <p>${lastPlaylist.songs[0]?.name || 'No songs'}</p>
                </div>
            </div>
        `;
        
        playlistContainer.appendChild(playlistElement);
    }
}

// Export necessary functions for testing
module.exports = {
    updatePlaybackBadge,
    displayPlaylists
};
