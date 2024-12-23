const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');

const audio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(audio);

// Initialize volume
audio.volume = 0.7; // 70%

// Playlist received handler
ipcRenderer.on('playlist-received', (event, playlist) => {
  console.log('New playlist received:', playlist);
  
  if (playlist && playlist.songs && playlist.songs.length > 0) {
    audioHandler.setCurrentPlaylistId(playlist._id);
    
    // Get current playback state
    const playbackState = playbackStateManager.getPlaybackState();
    console.log('Current playback state:', playbackState);
    
    // Save playlist to store
    const playlists = store.get('playlists', []);
    const existingIndex = playlists.findIndex(p => p._id === playlist._id);
    
    if (existingIndex !== -1) {
      playlists[existingIndex] = playlist;
    } else {
      playlists.push(playlist);
    }
    
    store.set('playlists', playlists);
    
    // Check if we should auto-play
    if (playbackState.isPlaying && playbackState.playlistId === playlist._id) {
      console.log('Auto-playing playlist:', playlist.name);
      ipcRenderer.invoke('play-playlist', playlist);
    } else {
      console.log('Loading playlist without auto-play');
      ipcRenderer.invoke('load-playlist', playlist);
      // Update playback state with new playlist ID but keep isPlaying false
      playbackStateManager.savePlaybackState(false, playlist._id);
    }
  }
});

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
    audio.play()
      .then(() => {
        playbackStateManager.savePlaybackState(true);
      })
      .catch(err => {
        console.error('Playback error:', err);
        playbackStateManager.savePlaybackState(false);
      });
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

// Audio event listeners
audio.addEventListener('ended', () => {
  console.log('Song ended, playing next');
  playbackStateManager.savePlaybackState(false);
  ipcRenderer.invoke('song-ended');
});

// Initial state check
document.addEventListener('DOMContentLoaded', () => {
  const playbackState = playbackStateManager.getPlaybackState();
  console.log('Initial playback state:', playbackState);
  
  // If we have a saved playlist and it should be playing, restore it
  if (playbackState.playlistId) {
    const playlists = store.get('playlists', []);
    const savedPlaylist = playlists.find(p => p._id === playbackState.playlistId);
    if (savedPlaylist) {
      console.log('Restoring saved playlist:', savedPlaylist.name);
      ipcRenderer.invoke(playbackState.isPlaying ? 'play-playlist' : 'load-playlist', savedPlaylist);
    }
  }
});
