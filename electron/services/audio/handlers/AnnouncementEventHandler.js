class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya başlamadan önce
    this.campaignAudio.addEventListener('loadstart', () => {
      console.log('Kampanya yükleniyor, playlist duraklatılıyor');
      // Playlist durumunu kaydet ve duraklat
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      if (this.wasPlaylistPlaying) {
        this.playlistAudio.pause();
      }
    });

    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      console.log('Kampanya başladı');
      this.isAnnouncementPlaying = true;
      
      // Emin olmak için playlist'i tekrar kontrol et ve duraklat
      if (!this.playlistAudio.paused) {
        console.log('Playlist hala çalıyor, durduruluyor');
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

    // Playlist'i devam ettirmeden önce kısa bir gecikme ekle
    setTimeout(() => {
      // Eğer playlist çalıyorduysa devam ettir
      if (this.wasPlaylistPlaying) {
        console.log('Playlist kaldığı yerden devam ediyor');
        this.playlistAudio.play().catch(err => {
          console.error('Playlist devam ettirme hatası:', err);
        });
      }
      
      // Durumları sıfırla
      this.wasPlaylistPlaying = false;
    }, 100); // 100ms gecikme
  }

  async playAnnouncement(audioPath) {
    if (!audioPath) {
      console.error('Kampanya için ses dosyası yolu bulunamadı');
      return false;
    }

    try {
      console.log('Kampanya başlatılıyor:', audioPath);
      
      // Eğer başka bir anons çalıyorsa, onu durdur
      if (this.isAnnouncementPlaying) {
        console.log('Önceki kampanya durduruluyor');
        this.cleanupAnnouncement();
      }

      // Önce playlist durumunu kaydet ve duraklat
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      if (this.wasPlaylistPlaying) {
        await this.playlistAudio.pause();
      }

      // Kısa bir gecikme ekle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Kampanya audio elementini hazırla ve çal
      this.campaignAudio.src = audioPath;
      await this.campaignAudio.play();
      
      this.isAnnouncementPlaying = true;
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