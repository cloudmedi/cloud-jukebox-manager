const AnnouncementEventHandler = require('./AnnouncementEventHandler');
const PlaylistEventHandler = require('./PlaylistEventHandler');
const playbackStateManager = require('../PlaybackStateManager');
const websocketService = require('../../websocketService');

class AudioEventHandler {
  constructor(playlistAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = document.getElementById('campaignPlayer');
    
    // Handler'ları başlat
    this.announcementHandler = new AnnouncementEventHandler(
      this.playlistAudio,
      this.campaignAudio
    );
    
    this.playlistHandler = new PlaylistEventHandler(
      this.playlistAudio,
      () => {
        // Sadece kampanya çalmıyorken sonraki şarkıya geç
        if (!this.announcementHandler.isPlaying()) {
          console.log('Şarkı bitti, sıradaki şarkıya geçiliyor');
          require('electron').ipcRenderer.invoke('song-ended');
        }
      }
    );

    // Event listener'ları ekle
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.playlistAudio.addEventListener('play', () => {
      console.log('Playback started');
      websocketService.sendMessage({
        type: 'playbackStatus',
        status: 'playing'
      });
    });

    this.playlistAudio.addEventListener('pause', () => {
      console.log('Playback paused');
      websocketService.sendMessage({
        type: 'playbackStatus',
        status: 'paused'
      });
    });

    this.playlistAudio.addEventListener('error', (error) => {
      console.error('Audio playback error:', error);
      websocketService.sendMessage({
        type: 'playbackStatus',
        status: 'error',
        error: error.message
      });
    });
  }

  async playCampaign(audioUrl) {
    console.log('Kampanya çalma isteği:', audioUrl);
    return this.announcementHandler.playAnnouncement(audioUrl);
  }

  setVolume(volume) {
    console.log('Setting volume:', volume);
    const normalizedVolume = volume / 100;
    
    // Playlist ses seviyesini ayarla
    this.playlistAudio.volume = normalizedVolume;
    
    // Kampanya ses seviyesini ayarla
    if (this.campaignAudio) {
      this.campaignAudio.volume = normalizedVolume;
    }

    websocketService.sendMessage({
      type: 'volumeUpdate',
      volume: volume
    });
  }

  isAnnouncementActive() {
    return this.announcementHandler.isPlaying();
  }
}

module.exports = AudioEventHandler;