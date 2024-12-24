class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.lastAnnouncementTime = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya başlamadan önce
    this.campaignAudio.addEventListener('loadeddata', () => {
      console.log('Kampanya yüklendi, playlist duraklatılıyor');
      if (!this.playlistAudio.paused) {
        this.wasPlaylistPlaying = true;
        this.playlistAudio.pause();
      }
    });

    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      console.log('Kampanya başladı');
      this.isAnnouncementPlaying = true;
      
      if (this.playlistAudio && !this.playlistAudio.paused) {
        console.log('Playlist duraklatılıyor');
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
    
    // Önce kampanya audio elementini temizle
    this.campaignAudio.src = '';
    this.isAnnouncementPlaying = false;
    
    // Son anons zamanını kaydet
    this.lastAnnouncementTime = Date.now();
    
    // Kampanya bittiğini bildir
    require('electron').ipcRenderer.send('announcement-ended');
    
    // Playlist'i devam ettir
    if (this.wasPlaylistPlaying) {
      console.log('Playlist kaldığı yerden devam ediyor');
      setTimeout(() => {
        this.playlistAudio.play().catch(err => {
          console.error('Playlist devam ettirme hatası:', err);
        });
      }, 500); // Küçük bir gecikme ekleyerek çakışmayı önle
    }
    
    // Durumları sıfırla
    this.wasPlaylistPlaying = false;
  }

  async playAnnouncement(audioPath) {
    // Minimum bekleme süresi kontrolü (5 saniye)
    const now = Date.now();
    const timeSinceLastAnnouncement = now - this.lastAnnouncementTime;
    
    if (timeSinceLastAnnouncement < 5000) {
      console.log('Son anonstan bu yana 5 saniye geçmedi, anons atlanıyor');
      return false;
    }

    if (!audioPath) {
      console.error('Kampanya için ses dosyası yolu bulunamadı');
      return false;
    }

    try {
      // Mevcut durumu kaydet
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      
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