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
    const shouldAutoPlay = playbackStateManager.getPlaybackState();
    console.log('Should auto play?', shouldAutoPlay);
    
    displayPlaylists();
    
    if (shouldAutoPlay) {
      console.log('Auto-playing based on saved state');
      ipcRenderer.invoke('play-playlist', playlist);
    } else {
      console.log('Loading playlist without auto-play');
      // Sadece playlist'i yükle, çalma
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow && playlist.songs[0]) {
        mainWindow.webContents.send('update-player', {
          playlist: playlist,
          currentSong: playlist.songs[0],
          isPlaying: false
        });
      }
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

// Function to display playlists
function displayPlaylists() {
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  if (!playlistContainer) {
    console.error('Playlist container not found');
    return;
  }
  
  playlistContainer.innerHTML = '';
  
  // Show the last playlist
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
