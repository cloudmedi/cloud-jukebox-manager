class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      console.log('Kampanya başladı, playlist duraklatılıyor');
      this.isAnnouncementPlaying = true;
      
      // Playlist'in mevcut durumunu kaydet
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      
      // Playlist'i duraklat
      if (this.wasPlaylistPlaying) {
        this.playlistAudio.pause();
      }
    });

    // Kampanya bittiğinde
    this.campaignAudio.addEventListener('ended', () => {
      console.log('Kampanya bitti, temizleniyor');
      this.cleanupAnnouncement();
    });

    // Kampanya hata durumunda
    this.campaignAudio.addEventListener('error', (error) => {
      console.error('Kampanya oynatma hatası:', error);
      this.cleanupAnnouncement();
    });
  }

  cleanupAnnouncement() {
    console.log('Kampanya durumu temizleniyor');
    
    // Kampanya audio elementini temizle
    this.campaignAudio.src = '';
    this.isAnnouncementPlaying = false;
    
    // Kampanya bittiğini bildir
    require('electron').ipcRenderer.send('announcement-ended');
    
    // Eğer playlist çalıyorduysa devam ettir
    if (this.wasPlaylistPlaying) {
      console.log('Playlist kaldığı yerden devam ediyor');
      this.playlistAudio.play().catch(err => {
        console.error('Playlist devam ettirme hatası:', err);
      });
    }
    
    // Durumları sıfırla
    this.wasPlaylistPlaying = false;
  }

  async playAnnouncement(audioPath) {
    if (!audioPath) {
      console.error('Kampanya için ses dosyası yolu bulunamadı');
      return false;
    }

    try {
      console.log('Kampanya başlatılıyor:', audioPath);
      
      // Kampanya audio elementini hazırla
      this.campaignAudio.src = audioPath;
      
      // Kampanyayı başlat
      await this.campaignAudio.play();
      return true;
    } catch (err) {
      console.error('Kampanya başlatma hatası:', err);
      this.cleanupAnnouncement();
      return false;
    }
  }

  isPlaying() {
    return this.isAnnouncementPlaying;
  }
}

module.exports = AnnouncementEventHandler;