const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');

const audio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(audio);

// Initialize volume
audio.volume = 0.7; // 70%

// Auto-play playlist
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
  console.log('Auto-playing playlist:', playlist);
  if (playlist && playlist.songs && playlist.songs.length > 0) {
    const playbackState = playbackStateManager.getPlaybackState();
    audioHandler.setCurrentPlaylistId(playlist._id);
    
    // Eğer playlist ID'leri eşleşiyorsa, kaydedilen durumu kullan
    const shouldAutoPlay = playbackState.playlistId === playlist._id ? 
      playbackState.isPlaying : false; // Varsayılan olarak çalma
    
    console.log('Should auto-play:', shouldAutoPlay, 'Playback state:', playbackState);
    
    displayPlaylists();
    
    if (shouldAutoPlay) {
      console.log('Auto-playing based on saved state');
      ipcRenderer.invoke('play-playlist', playlist);
    } else {
      console.log('Not auto-playing due to saved state');
      ipcRenderer.invoke('load-playlist', playlist);
    }
  }
});

// Close button event listener
document.getElementById('closeButton').addEventListener('click', () => {
    window.close();
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
          playbackStateManager.savePlaybackState(true);
          ipcRenderer.send('playback-status-changed', true);
        })
        .catch(err => {
          console.error('Playback error:', err);
          playbackStateManager.savePlaybackState(false);
          ipcRenderer.send('playback-status-changed', false);
        });
    } else {
      audio.pause();
      console.log('Playback paused');
      playbackStateManager.savePlaybackState(false);
      ipcRenderer.send('playback-status-changed', false);
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

// Diğer event listener'lar
