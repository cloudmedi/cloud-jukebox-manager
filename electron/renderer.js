const { ipcRenderer } = require('electron');
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const audioPlayer = require('./services/audioPlayer');
const playbackStateManager = require('./services/audio/PlaybackStateManager');

let audioEventHandler;

document.addEventListener('DOMContentLoaded', () => {
  const playlistAudio = document.getElementById('audioPlayer');
  
  if (!playlistAudio) {
    console.error('Audio element not found!');
    return;
  }

  audioEventHandler = new AudioEventHandler(playlistAudio);

  // Volume kontrolü
  ipcRenderer.on('set-volume', (event, volume) => {
    audioEventHandler.setVolume(volume);
  });

  // Playback toggle
  ipcRenderer.on('toggle-playback', () => {
    if (playlistAudio.paused) {
      playlistAudio.play();
      ipcRenderer.send('update-playback-status', true);
    } else {
      playlistAudio.pause();
      ipcRenderer.send('update-playback-status', false);
    }
  });

  // Player güncelleme
  ipcRenderer.on('update-player', (event, data) => {
    if (data.currentSong && data.currentSong.localPath) {
      playlistAudio.src = data.currentSong.localPath;
      if (data.isPlaying) {
        playlistAudio.play();
      }
      ipcRenderer.send('update-song-info', data.currentSong);
    }
  });

  // Kampanya çalma
  ipcRenderer.on('play-campaign', async (event, campaign) => {
    if (audioEventHandler.isAnnouncementActive()) {
      console.log('Başka bir kampanya çalıyor, beklemede...');
      return;
    }

    try {
      await AnnouncementAudioService.playAnnouncement(campaign);
    } catch (error) {
      console.error('Kampanya çalma hatası:', error);
    }
  });

  // Update tray menu when song changes
  playlistAudio.addEventListener('loadeddata', () => {
    const songInfo = {
      name: playlistAudio.getAttribute('data-song-name') || 'Unknown Song',
      artist: playlistAudio.getAttribute('data-artist') || 'Unknown Artist'
    };
    ipcRenderer.send('update-song-info', songInfo);
  });

  // Update tray menu when playback status changes
  playlistAudio.addEventListener('play', () => {
    ipcRenderer.send('update-playback-status', true);
  });

  playlistAudio.addEventListener('pause', () => {
    ipcRenderer.send('update-playback-status', false);
  });

  // Next track handler
  ipcRenderer.on('next-track', () => {
    if (!audioEventHandler.isAnnouncementActive()) {
      ipcRenderer.invoke('song-ended');
    }
  });

  // Initial playback state
  const initialState = playbackStateManager.getPlaybackState();
  if (initialState) {
    ipcRenderer.send('update-playback-status', initialState);
  }
});

// Error handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Window Error:', msg, url, lineNo, columnNo, error);
  return false;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled Promise Rejection:', event.reason);
});