class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya yüklendiğinde
    this.campaignAudio.addEventListener('loadeddata', () => {
      console.log('Anons yüklendi, playlist durumu kontrol ediliyor');
      
      // Playlist durumunu kaydet ve durdur
      if (!this.isAnnouncementPlaying) {
        this.wasPlaylistPlaying = !this.playlistAudio.paused;
        if (this.wasPlaylistPlaying) {
          console.log('Playlist duraklatılıyor...');
          this.playlistAudio.pause();
        }
      }
    });

    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      console.log('Anons başladı');
      this.isAnnouncementPlaying = true;
      
      // Eğer playlist hala çalıyorsa, durdur
      if (!this.playlistAudio.paused) {
        console.log('Playlist zorla durduruluyor');
        this.playlistAudio.pause();
      }
    });

    // Kampanya bittiğinde
    this.campaignAudio.addEventListener('ended', () => {
      console.log('Anons bitti, temizleme başlıyor');
      this.resetAnnouncementState();
    });

    // Kampanya hata durumunda
    this.campaignAudio.addEventListener('error', (error) => {
      console.error('Anons oynatma hatası:', error);
      this.resetAnnouncementState();
    });
  }

  resetAnnouncementState() {
    if (!this.isAnnouncementPlaying) return;

    console.log('Anons durumu sıfırlanıyor');
    
    // Kampanyayı duraklat ve temizle
    this.campaignAudio.pause();
    this.campaignAudio.currentTime = 0;
    this.campaignAudio.src = '';
    
    // Flag'i sıfırla
    this.isAnnouncementPlaying = false;
    
    // Anonsun bittiğini bildir
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('announcement-ended');
    
    // Playlist'i devam ettir
    if (this.wasPlaylistPlaying) {
      console.log('Playlist kaldığı yerden devam ediyor');
      setTimeout(() => {
        if (!this.isAnnouncementPlaying) {
          this.playlistAudio.play().catch(err => {
            console.error('Playlist devam ettirme hatası:', err);
          });
        }
      }, 500);
    }
    
    // wasPlaylistPlaying durumunu sıfırla
    this.wasPlaylistPlaying = false;
  }

  async playAnnouncement(audioPath) {
    if (!audioPath) {
      console.error('Anons için ses dosyası yolu bulunamadı');
      return false;
    }

    try {
      // Eğer başka bir anons çalıyorsa, onu durdur
      if (this.isAnnouncementPlaying) {
        await this.resetAnnouncementState();
      }

      console.log('Anons başlatılıyor:', audioPath);
      
      // Önce playlist'i duraklat
      if (!this.playlistAudio.paused) {
        this.wasPlaylistPlaying = true;
        this.playlistAudio.pause();
      }
      
      // Anons audio elementini hazırla
      this.campaignAudio.src = audioPath;
      
      // Volume değerini al ve uygula
      const store = new (require('electron-store'))();
      const volume = store.get('volume', 70);
      this.campaignAudio.volume = volume / 100;
      
      // Ses dosyasını yükle ve çal
      await this.campaignAudio.load();
      await this.campaignAudio.play();
      
      return true;
    } catch (err) {
      console.error('Anons başlatma hatası:', err);
      await this.resetAnnouncementState();
      return false;
    }
  }

  isPlaying() {
    return this.isAnnouncementPlaying;
  }

  cleanup() {
    this.resetAnnouncementState();
    this.campaignAudio.removeEventListener('loadeddata', this.setupEventListeners);
    this.campaignAudio.removeEventListener('play', this.setupEventListeners);
    this.campaignAudio.removeEventListener('ended', this.setupEventListeners);
    this.campaignAudio.removeEventListener('error', this.setupEventListeners);
  }
}

module.exports = AnnouncementEventHandler;