const AnnouncementEventHandler = require('./handlers/AnnouncementEventHandler');
const PlaylistEventHandler = require('./handlers/PlaylistEventHandler');
const playbackStateManager = require('./PlaybackStateManager');

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

    // Anons bittiğinde playlist'i devam ettir
    require('electron').ipcRenderer.on('announcement-ended', (event, { lastPlaylistIndex, wasPlaying }) => {
      console.log('Anons bitti sinyali alındı:', { lastPlaylistIndex, wasPlaying });
      if (wasPlaying) {
        setTimeout(() => {
          this.playlistAudio.play().catch(err => {
            console.error('Playlist devam ettirme hatası:', err);
          });
        }, 500);
      }
    });
  }

  async playCampaign(audioUrl) {
    console.log('Kampanya çalma isteği:', audioUrl);
    return this.announcementHandler.playAnnouncement(audioUrl);
  }

  setVolume(volume) {
    const normalizedVolume = volume / 100;
    this.playlistAudio.volume = normalizedVolume;
    this.campaignAudio.volume = normalizedVolume;
  }

  isAnnouncementActive() {
    return this.announcementHandler.isPlaying();
  }
}

module.exports = AudioEventHandler;