const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');

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
  
  // Anonsu çal
  const success = await AnnouncementAudioService.playAnnouncement(announcement);
  
  if (!success) {
    console.error('Failed to play announcement');
  }
});

ipcRenderer.on('pause-playback', () => {
  if (playlistAudio && !playlistAudio.paused) {
    playlistAudio.pause();
  }
});

ipcRenderer.on('resume-playback', () => {
  if (playlistAudio && playlistAudio.paused) {
    playlistAudio.play().catch(err => console.error('Resume playback error:', err));
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
  const playlists = store.get('playlists', []);
  
  if (!playlists.length) {
    console.log('No playlists found');
    return;
  }
  
  const lastPlaylist = playlists[playlists.length - 1];
  if (!lastPlaylist || !lastPlaylist.songs.length) {
    console.log('No songs in playlist');
    return;
  }

  // Çalan şarkıyı göster
  const currentSong = lastPlaylist.songs[0];
  document.getElementById('currentSongName').textContent = currentSong.name || 'Unknown';
  document.getElementById('currentArtist').textContent = currentSong.artist || 'Unknown Artist';
  
  if (currentSong.artwork) {
    const currentArtwork = document.getElementById('currentArtwork');
    currentArtwork.innerHTML = `<img src="${currentSong.artwork}" alt="${currentSong.name}" class="playlist-artwork"/>`;
    currentArtwork.className = 'playlist-artwork';
  }

  // Sıradaki şarkıyı göster
  if (lastPlaylist.songs.length > 1) {
    const nextSong = lastPlaylist.songs[1];
    document.getElementById('nextSongName').textContent = nextSong.name || 'Unknown';
    document.getElementById('nextArtist').textContent = nextSong.artist || 'Unknown Artist';
    
    if (nextSong.artwork) {
      const nextArtwork = document.getElementById('nextArtwork');
      nextArtwork.innerHTML = `<img src="${nextSong.artwork}" alt="${nextSong.name}" class="playlist-artwork"/>`;
      nextArtwork.className = 'playlist-artwork';
    }
  }
}

// Şarkı değiştiğinde görüntülemeyi güncelle
ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
  console.log('Updating player with song:', currentSong);
  if (currentSong && currentSong.localPath) {
    const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
    playlistAudio.src = normalizedPath;
    playlistAudio.play().catch(err => console.error('Playback error:', err));
    
    // Playlist'i güncelle ve görüntüle
    const playlists = store.get('playlists', []);
    if (playlists.length > 0) {
      const currentIndex = playlists[playlists.length - 1].songs.findIndex(
        song => song._id === currentSong._id
      );
      
      if (currentIndex !== -1) {
        const nextSong = playlists[playlists.length - 1].songs[currentIndex + 1];
        if (nextSong) {
          document.getElementById('nextSongName').textContent = nextSong.name || 'Unknown';
          document.getElementById('nextArtist').textContent = nextSong.artist || 'Unknown Artist';
          
          if (nextSong.artwork) {
            const nextArtwork = document.getElementById('nextArtwork');
            nextArtwork.innerHTML = `<img src="${nextSong.artwork}" alt="${nextSong.name}" class="playlist-artwork"/>`;
            nextArtwork.className = 'playlist-artwork';
          }
        }
      }
    }
    
    displayPlaylists();
  }
});

// İlk yüklemede playlistleri göster
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, displaying playlists');
  displayPlaylists();
});
