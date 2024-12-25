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

// Audio element initialization
const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);
const audioUpdateHandler = new AudioUpdateHandler(playlistAudio);

// Initialize volume
playlistAudio.volume = 0.7; // 70%

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing audio handlers');
  
  // Restore last playlist if exists
  const lastPlaylist = store.get('currentPlaylist');
  if (lastPlaylist) {
    console.log('Restoring last playlist:', lastPlaylist.name);
    audioUpdateHandler.updatePlaylistDisplay(lastPlaylist, lastPlaylist.currentSong);
  }
});

// Playlist events
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
  store.set('currentPlaylist', playlist);
  
  const shouldAutoPlay = playbackStateManager.getPlaybackState();
  if (shouldAutoPlay) {
    console.log('Auto-playing new playlist:', playlist);
    ipcRenderer.invoke('play-playlist', playlist);
  } else {
    console.log('Loading new playlist without auto-play');
    ipcRenderer.invoke('load-playlist', playlist);
  }
  
  audioUpdateHandler.updatePlaylistDisplay(playlist, playlist.songs[0]);
});

// Song ended event
playlistAudio.addEventListener('ended', () => {
  console.log('Song ended, playing next');
  ipcRenderer.invoke('song-ended');
});

// Song update event
ipcRenderer.on('update-player', (event, data) => {
  console.log('Received player update:', data);
  audioUpdateHandler.updateCurrentSong(data.currentSong);
  audioUpdateHandler.updatePlaylistDisplay(data.playlist, data.currentSong);
});
