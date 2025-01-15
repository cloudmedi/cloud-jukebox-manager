const { ipcMain, app } = require('electron');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./websocketService');
const AnnouncementManager = require('./announcement/AnnouncementManager');
const AnnouncementScheduler = require('./announcement/AnnouncementScheduler');
const apiService = require('./apiService');
const deviceService = require('./deviceService');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.queue = [];
    this.isPlaying = false;
    this.playStartTime = null;
    this.isProcessingEndEvent = false;  
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

  async handlePlay() {
    if (this.currentSound && !this.isPlaying) {
      this.isPlaying = true;
      this.playStartTime = Date.now();  // Çalma başlangıç zamanını kaydet
      
      websocketService.sendMessage({
        type: 'playbackStatus',
        status: 'playing'
      });
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
    // Playlist çalma başlangıcı
    ipcMain.handle('play-playlist', async (event, playlist) => {
      try {
        console.log('Playing playlist:', playlist);
        
        if (!playlist || !playlist.songs || !Array.isArray(playlist.songs)) {
          console.error('Invalid playlist format:', playlist);
          event.sender.send('playlist-error', 'Invalid playlist format');
          return { success: false, error: 'Invalid playlist format' };
        }
        
        // Mevcut çalan playlist'i durdur
        if (this.isPlaying) {
          event.sender.send('toggle-playback');
        }
        
        // Yeni playlist'i ayarla
        this.queue = [...playlist.songs];
        this.playlist = playlist;
        this.currentIndex = 0;
        this.isPlaying = true;
        this.playStartTime = Date.now(); // Çalma başlangıç zamanını kaydet
        
        // İlk şarkıyı çal
        const firstSong = this.queue[this.currentIndex];
        if (firstSong) {
          event.sender.send('update-player', {
            playlist: this.playlist,
            currentSong: firstSong,
            isPlaying: true
          });

          // Playlist durumunu güncelle
          this.sendPlaybackStatus();
          return { success: true };
        } else {
          console.error('No songs in playlist');
          event.sender.send('playlist-error', 'No songs in playlist');
          return { success: false, error: 'No songs in playlist' };
        }
      } catch (error) {
        console.error('Error playing playlist:', error);
        event.sender.send('playlist-error', error.message);
        return { success: false, error: error.message };
      }
    });

    // Şarkı başlama event'i
    ipcMain.handle('song-started', async (event, data = {}) => {
      console.log('Song started:', data);
      this.playStartTime = Date.now();
      this.isPlaying = true;
    });

    // Şarkı bitme event'i
    ipcMain.handle('song-ended', async (event, data = {}) => {
      try {
        // Eğer zaten işleniyorsa, çık
        if (this.isProcessingEndEvent) {
          console.log('Already processing end event, skipping...');
          return;
        }

        this.isProcessingEndEvent = true;

        // Anons kontrolü için song-ended eventi
        AnnouncementScheduler.onSongEnd();
        
        // Çalma geçmişini kaydet
        const currentSong = this.queue[this.currentIndex];
        if (currentSong) {
          // Gerçek çalma süresini hesapla
          let actualDuration = 0;
          if (this.playStartTime) {
            actualDuration = Math.floor((Date.now() - this.playStartTime) / 1000);
            console.log('Actual play duration:', actualDuration, 'seconds');
          }

          await this.savePlaybackHistory(currentSong, actualDuration);
        }
        
        await this.handleNextSong(event);

        // İşlem bitti
        this.isProcessingEndEvent = false;
        this.playStartTime = null; // Süreyi sıfırla
      } catch (error) {
        console.error('Error handling song-ended event:', error);
        this.isProcessingEndEvent = false;
        this.playStartTime = null;
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

        await websocketService.sendMessage({
          type: 'deviceStatus',
          data: {
            token: deviceToken,
            isPlaying: this.isPlaying,
            volume: this.volume,
            status: 'completed',
            currentSong: this.currentSong
          }
        });
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
      const deviceId = deviceService.getDeviceId();
      if (!deviceId || !song?._id) {
        console.error('Device ID or Song ID missing for playback history', {
          deviceId,
          songId: song?._id
        });
        return;
      }

      const playbackData = {
        deviceId,
        songId: song._id,
        playDuration: duration,
        completed: duration >= (song.duration * 0.9) // Şarkının en az %90'ı çalındıysa tamamlandı sayılır
      };

      const response = await apiService.post('/stats/playback-history', playbackData);
      console.log('Playback history saved:', response);
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
