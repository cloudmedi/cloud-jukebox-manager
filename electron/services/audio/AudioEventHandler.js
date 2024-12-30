const AnnouncementEventHandler = require('./handlers/AnnouncementEventHandler');
const PlaylistEventHandler = require('./handlers/PlaylistEventHandler');
const playbackStateManager = require('./PlaybackStateManager');
const FadeAudioPlayer = require('./FadeAudioPlayer');

class AudioEventHandler {
  constructor(playlistAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = document.getElementById('campaignPlayer');
    this.fadePlayer = new FadeAudioPlayer();
    
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

    // Fade geçişleri için event listener'lar
    this.playlistAudio.addEventListener('timeupdate', () => {
      const timeRemaining = this.playlistAudio.duration - this.playlistAudio.currentTime;
      if (timeRemaining <= 5 && !this.fadePlayer.isFading) {
        // Sonraki şarkıyı hazırla
        const nextSong = playbackStateManager.getNextSong();
        if (nextSong) {
          this.fadePlayer.prepareNextSong(nextSong);
        }
      }
    });
  }

  async playCampaign(audioUrl) {
    console.log('Kampanya çalma isteği:', audioUrl);
    return this.announcementHandler.playAnnouncement(audioUrl);
  }

  setVolume(volume) {
    console.log('Setting volume for both players:', volume);
    const normalizedVolume = volume / 100;
    
    // Playlist ses seviyesini ayarla
    this.playlistAudio.volume = normalizedVolume;
    console.log('Playlist volume set to:', normalizedVolume);
    
    // Kampanya ses seviyesini ayarla
    if (this.campaignAudio) {
      this.campaignAudio.volume = normalizedVolume;
      console.log('Campaign volume set to:', normalizedVolume);
    } else {
      console.warn('Campaign audio element not found');
    }

    // Fade player ses seviyesini ayarla
    this.fadePlayer.setVolume(normalizedVolume);
  }

  isAnnouncementActive() {
    return this.announcementHandler.isPlaying();
  }
}

module.exports = AudioEventHandler;