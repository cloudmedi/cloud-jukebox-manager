const { ipcMain, app } = require('electron');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./websocketService');
const AnnouncementManager = require('./announcement/AnnouncementManager');
const AnnouncementScheduler = require('./announcement/AnnouncementScheduler');
const PlaybackHistoryService = require('./playback/PlaybackHistoryService');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.queue = [];
    this.isPlaying = false;
    this.playStartTime = null;
    this.setupIpcHandlers();
    this.setupWebSocketHandlers();
    
    // AnnouncementScheduler'ı başlat
    AnnouncementScheduler.initialize();
  }

  setupWebSocketHandlers() {
    websocketService.addMessageHandler('command', async (message) => {
      console.log('Received command:', message);
      switch (message.command) {
        case 'setVolume':
          this.handleVolumeChange(message.volume);
          break;
        case 'restart':
          this.handleRestart();
          break;
        case 'play':
          this.handlePlay();
          break;
        case 'pause':
          this.handlePause();
          break;
        case 'playAnnouncement':
          await this.handleAnnouncement(message.announcement);
          break;
        default:
          console.log('Unknown command:', message.command);
      }
    });
  }

  async handleAnnouncement(announcement) {
    try {
      // Anonsu indir ve hazırla
      const processedAnnouncement = await AnnouncementManager.handleNewAnnouncement(announcement);
      console.log('Announcement processed:', processedAnnouncement);
    } catch (error) {
      console.error('Error handling announcement:', error);
    }
  }

  handleVolumeChange(volume) {
    console.log('1. Volume change received in Electron:', {
      volume,
      currentVolume: this.currentSound?.volume() || 0
    });

    try {
      console.log('2. Setting volume on audio element');
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      
      if (mainWindow) {
        console.log('3. Main window found, sending volume change');
        mainWindow.webContents.send('set-volume', volume);
        
        console.log('4. Volume change sent to renderer');
        // WebSocket üzerinden durumu bildir
        websocketService.sendMessage({
          type: 'commandStatus',
          command: 'setVolume',
          status: 'success',
          volume: volume
        });
        
        console.log('5. Command status sent via WebSocket');
      } else {
        console.error('6. Main window not found');
      }
    } catch (error) {
      console.error('7. Volume change error:', {
        error: error.message,
        stack: error.stack
      });
      
      websocketService.sendMessage({
        type: 'commandStatus',
        command: 'setVolume',
        status: 'error',
        error: error.message
      });
    }
  }

  handleRestart() {
    console.log('Restarting application...');
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 1000);
  }

  handlePlay() {
    console.log('Play command received, current state:', this.isPlaying);
    if (!this.isPlaying) {
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('toggle-playback');
        this.isPlaying = true;
        this.sendPlaybackStatus();
      }
    } else {
      console.log('Already playing, ignoring play command');
      this.sendPlaybackStatus();
    }
  }

  handlePause() {
    console.log('Pause command received, current state:', this.isPlaying);
    if (this.isPlaying) {
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('toggle-playback');
        this.isPlaying = false;
        this.sendPlaybackStatus();
      }
    } else {
      console.log('Already paused, ignoring pause command');
      this.sendPlaybackStatus();
    }
  }

  sendPlaybackStatus() {
    websocketService.sendMessage({
      type: 'playbackStatus',
      status: this.isPlaying ? 'playing' : 'paused'
    });
  }

  setupIpcHandlers() {
    ipcMain.handle('play-playlist', async (event, playlist) => {
      console.log('Playing playlist:', playlist);
      
      // Mevcut çalan playlist'i durdur
      if (this.isPlaying) {
        event.sender.send('toggle-playback');
      }
      
      // Yeni playlist'i ayarla
      this.queue = [...playlist.songs];
      this.playlist = playlist;
      this.currentIndex = 0;
      this.isPlaying = true;
      
      // İlk şarkıyı çal
      const firstSong = this.queue[this.currentIndex];
      if (firstSong) {
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: firstSong,
          isPlaying: true
        });

        // Playlist durumunu güncelle
        websocketService.sendMessage({
          type: 'playlistStatus',
          status: 'loaded',
          playlistId: playlist._id
        });
      }
    });

    ipcMain.handle('load-playlist', async (event, playlist) => {
      console.log('Loading playlist without auto-play:', playlist);
      this.queue = [...playlist.songs];
      this.playlist = playlist;
      this.currentIndex = 0;
      this.isPlaying = false;
      
      const firstSong = this.queue[this.currentIndex];
      if (firstSong) {
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: firstSong,
          isPlaying: false
        });

        websocketService.sendMessage({
          type: 'playlistStatus',
          status: 'loaded',
          playlistId: playlist._id
        });
      }
    });

    ipcMain.handle('song-ended', async (event, params) => {
      try {
        console.log('Song ended event received with params:', params);
        
        // Anons kontrolü için song-ended eventi
        AnnouncementScheduler.onSongEnd();
        
        // Çalma geçmişini kaydet
        const currentSong = this.queue[this.currentIndex];
        if (currentSong && params?.duration) {
          await PlaybackHistoryService.savePlaybackHistory(currentSong, params.duration);
        } else {
          console.warn('Missing song or duration data:', {
            currentSong,
            duration: params?.duration
          });
        }
        
        this.handleNextSong(event);
      } catch (error) {
        console.error('Error handling song-ended event:', error);
      }
    });

    // Anons bittiğinde çağrılacak
    ipcMain.on('announcement-ended', (event, { lastPlaylistIndex }) => {
      console.log('Anons bitti, playlist devam ediyor. Son indeks:', lastPlaylistIndex);
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow && this.isPlaying) {
        this.currentIndex = lastPlaylistIndex;
        const nextSong = this.queue[this.currentIndex + 1];
        if (nextSong) {
          mainWindow.webContents.send('update-player', {
            playlist: this.playlist,
            currentSong: nextSong,
            isPlaying: true
          });
        }
      }
    });

    // Playlist durumunu sorgulama
    ipcMain.on('get-current-playlist', (event) => {
      event.returnValue = {
        currentIndex: this.currentIndex,
        isPlaying: this.isPlaying
      };
    });
  }

  handleNextSong(event) {
    if (this.queue.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.queue.length;
      const nextSong = this.queue[this.currentIndex];
      
      event.sender.send('update-player', {
        playlist: this.playlist,
        currentSong: nextSong,
        isPlaying: true
      });
    }
  }

  async savePlaybackHistory(song, duration) {
    try {
      const deviceId = store.get('deviceId');
      if (!deviceId || !song?._id) {
        console.error('Device ID or Song ID missing for playback history');
        return;
      }

      const playbackData = {
        deviceId,
        songId: song._id,
        playDuration: Math.floor(duration || 0),
        completed: duration >= (song.duration * 0.9) // Şarkının en az %90'ı çalındıysa tamamlandı sayılır
      };

      console.log('Saving playback history:', playbackData);
      const response = await apiService.post('/api/stats/playback-history', playbackData);
      console.log('Playback history saved:', response.data);
    } catch (error) {
      console.error('Error saving playback history:', error);
    }
  }

  handleSongDeleted(songId) {
    if (this.currentSound && this.queue[this.currentIndex]._id === songId) {
      // Çalan şarkı silindiyse sonraki şarkıya geç
      this.handleNextSong();
    }
    
    // Kuyruktaki şarkıyı sil
    this.queue = this.queue.filter(song => song._id !== songId);
    
    // Çalma listesini güncelle
    if (this.playlist) {
      this.playlist.songs = this.playlist.songs.filter(song => song._id !== songId);
    }
  }
}

module.exports = new AudioService();