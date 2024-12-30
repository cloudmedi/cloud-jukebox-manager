const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const store = new Store();
const AudioEventHandler = require('./services/audio/AudioEventHandler');
const playbackStateManager = require('./services/audio/PlaybackStateManager');
const UIManager = require('./services/ui/UIManager');
const AnnouncementAudioService = require('./services/audio/AnnouncementAudioService');
const PlaylistInitializer = require('./services/playlist/PlaylistInitializer');
const PlayerUIManager = require('./services/ui/PlayerUIManager');
const VolumeManager = require('./services/audio/VolumeManager');

const playlistAudio = document.getElementById('audioPlayer');
const audioHandler = new AudioEventHandler(playlistAudio);

const initialVolume = VolumeManager.getStoredVolume();
playlistAudio.volume = VolumeManager.normalizeVolume(initialVolume);
console.log('Initial volume set from store:', initialVolume);

ipcRenderer.on('emergency-stop', () => {
  console.log('Emergency stop received');
  
  if (playlistAudio) {
    playlistAudio.pause();
    playlistAudio.currentTime = 0;
    playlistAudio.volume = 0;
  }

  const campaignAudio = document.getElementById('campaignPlayer');
  if (campaignAudio) {
    campaignAudio.pause();
    campaignAudio.currentTime = 0;
    campaignAudio.volume = 0;
  }

  const store = new Store();
  store.set('playbackState', {
    isPlaying: false,
    emergencyStopped: true
  });

  showEmergencyMessage();
});

ipcRenderer.on('emergency-reset', () => {
  console.log('Emergency reset received');
  hideEmergencyMessage();
  
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

ipcRenderer.on('play-announcement', async (event, announcement) => {
  console.log('Received announcement:', announcement);
  
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

ipcRenderer.on('websocket-status', (event, isConnected) => {
    UIManager.updateConnectionStatus(isConnected);
});

ipcRenderer.on('download-progress', (event, { songName, progress }) => {
    UIManager.showDownloadProgress(progress, songName);
});

ipcRenderer.on('error', (event, message) => {
    UIManager.showError(message);
});

ipcRenderer.on('set-volume', (event, volume) => {
    console.log('Setting volume to:', volume);
    const savedVolume = VolumeManager.saveVolume(volume);
    const normalizedVolume = VolumeManager.normalizeVolume(savedVolume);
    
    playlistAudio.volume = normalizedVolume;
    
    ipcRenderer.send('volume-changed', savedVolume);
});

ipcRenderer.on('restart-playback', () => {
  console.log('Restarting playback');
  if (playlistAudio) {
    playlistAudio.currentTime = 0;
    playlistAudio.play().catch(err => console.error('Playback error:', err));
  }
});

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

ipcRenderer.on('auto-play-playlist', (event, playlist) => {
  console.log('Auto-playing playlist:', playlist);
  if (playlist && playlist.songs && playlist.songs.length > 0) {
    const shouldAutoPlay = playbackStateManager.getPlaybackState();
    
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

async function displayPlaylists() {
  console.log('8. Starting displayPlaylists()');
  const playlists = store.get('playlists', []);
  const playlistContainer = document.getElementById('playlistContainer');
  
  if (!playlistContainer) {
    console.error('9. Playlist container not found');
    return;
  }
  
  console.log('10. Current playlists:', playlists);
  
  playlistContainer.innerHTML = '';
  
  const lastPlaylist = playlists[playlists.length - 1];
  if (lastPlaylist) {
    console.log('11. Displaying last playlist:', lastPlaylist);
    
    let artworkPath = null;
    if (lastPlaylist.artwork) {
      try {
        const { downloadArtwork } = require('./services/downloadUtils');
        artworkPath = await downloadArtwork(lastPlaylist.artwork, lastPlaylist._id);
        console.log('Artwork downloaded:', artworkPath);
      } catch (error) {
        console.error('Error downloading artwork:', error);
      }
    }

    const playlistElement = document.createElement('div');
    playlistElement.className = 'playlist-item';
    playlistElement.innerHTML = `
      <div class="playlist-info">
        ${artworkPath ? 
          `<img src="file://${artworkPath}" alt="${lastPlaylist.name}" class="playlist-artwork"/>` :
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
    console.log('12. Playlist element added to DOM');
  } else {
    console.warn('13. No playlist available to display');
  }
}

function deleteOldPlaylists() {
  const playlists = store.get('playlists', []);
  
  if (playlists.length > 1) {
    const latestPlaylist = playlists[playlists.length - 1];
    
    playlists.slice(0, -1).forEach(playlist => {
      playlist.songs.forEach(song => {
        if (song.localPath) {
          try {
            fs.unlinkSync(song.localPath);
            console.log(`Deleted song file: ${song.localPath}`);
            
            const playlistDir = path.dirname(song.localPath);
            
            const files = fs.readdirSync(playlistDir);
            files.forEach(file => {
              const filePath = path.join(playlistDir, file);
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
            });
            
            fs.rmdirSync(playlistDir);
            console.log(`Deleted playlist directory: ${playlistDir}`);
          } catch (error) {
            console.error(`Error deleting files/directory: ${error}`);
          }
        }
      });
    });
    
    store.set('playlists', [latestPlaylist]);
    console.log('Kept only the latest playlist:', latestPlaylist.name);
  }
}

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

ipcRenderer.on('device-deleted', (event, id) => {
  console.log('Device deleted, cleaning up...');
  
  if (playlistAudio) {
    playlistAudio.pause();
    playlistAudio.src = '';
  }

  store.clear();
  
  const deviceToken = store.get('deviceInfo.token');
  const deviceInfo = store.get('deviceInfo.deviceInfo');
  if (deviceToken && deviceInfo) {
    store.set('deviceInfo', {
      token: deviceToken,
      deviceInfo: deviceInfo
    });
  }

  const playlistContainer = document.getElementById('playlistContainer');
  if (playlistContainer) {
    playlistContainer.innerHTML = '';
  }
});

ipcRenderer.on('songRemoved', (event, { songId, playlistId }) => {
  console.log('Şarkı silme mesajı alındı:', { songId, playlistId });
  
  const playlists = store.get('playlists', []);
  const playlistIndex = playlists.findIndex(p => p._id === playlistId);
  
  if (playlistIndex !== -1) {
    console.log('Playlist bulundu:', playlistId);
    const removedSong = playlists[playlistIndex].songs.find(s => s._id === songId);
    playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(
      song => song._id !== songId
    );
    
    store.set('playlists', playlists);
    console.log('Playlist güncellendi');
    
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

playlistAudio.addEventListener('ended', () => {
  console.log('14. Song ended, playing next');
  ipcRenderer.invoke('song-ended');
});

playlistAudio.addEventListener('play', () => {
  console.log('15. Audio started playing');
});

playlistAudio.addEventListener('pause', () => {
  console.log('16. Audio paused');
});

playlistAudio.addEventListener('loadeddata', () => {
  console.log('17. Audio data loaded successfully');
});

playlistAudio.addEventListener('error', (e) => {
  console.error('18. Audio error:', e);
});

ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
  console.log('1. Update Player Event Received:', { playlist, currentSong });
  
  if (currentSong && currentSong.localPath) {
    console.log('2. Current Song Data:', {
      name: currentSong.name,
      artist: currentSong.artist,
      localPath: currentSong.localPath
    });

    const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
    playlistAudio.src = normalizedPath;
    
    console.log('3. Setting audio source to:', normalizedPath);
    
    playlistAudio.play().catch(err => {
      console.error('4. Playback error:', err);
    });
    
    PlayerUIManager.updateCurrentSong(currentSong);
    
    ipcRenderer.send('song-changed', {
      name: currentSong.name,
      artist: currentSong.artist
    });
  } else {
    console.warn('7. Invalid song data received:', currentSong);
  }
});

ipcRenderer.on('next-song', () => {
  console.log('Next song requested from tray menu');
  ipcRenderer.invoke('song-ended');
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, displaying playlists');
  displayPlaylists();
});

ipcRenderer.on('show-toast', (event, toast) => {
  switch(toast.type) {
    case 'success':
      new Notification('Başarılı', {
        body: toast.message
      });
      break;
    case 'error':
      new Notification('Hata', {
        body: toast.message
      });
      break;
    case 'loading':
      new Notification('İşlem Devam Ediyor', {
        body: toast.message
      });
      break;
  }
});