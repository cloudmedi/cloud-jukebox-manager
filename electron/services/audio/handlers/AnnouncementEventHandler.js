class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.lastPlaylistIndex = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya yüklendiğinde
    this.campaignAudio.addEventListener('loadeddata', () => {
      console.log('Anons yüklendi, playlist durumu kontrol ediliyor');
      
      // Playlist durumunu ve mevcut şarkı indeksini kaydet
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      console.log('Playlist durumu kaydedildi:', this.wasPlaylistPlaying);
      
      // Mevcut şarkı indeksini kaydet
      const currentPlaylist = require('electron').ipcRenderer.sendSync('get-current-playlist');
      if (currentPlaylist) {
        this.lastPlaylistIndex = currentPlaylist.currentIndex;
        console.log('Kaydedilen playlist indeksi:', this.lastPlaylistIndex);
      }

      // Playlist'i duraklat
      if (this.wasPlaylistPlaying) {
        console.log('Playlist duraklatılıyor');
        this.playlistAudio.pause();
      }
    });

    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      console.log('Anons başladı');
      this.isAnnouncementPlaying = true;
      
      // Playlist'i kesinlikle duraklat
      if (!this.playlistAudio.paused) {
        console.log('Playlist zorla duraklatılıyor');
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
    console.log('Anons durumu sıfırlanıyor');
    console.log('Önceki playlist durumu:', this.wasPlaylistPlaying);
    
    // Kampanyayı duraklat ve temizle
    this.campaignAudio.pause();
    this.campaignAudio.currentTime = 0;
    this.campaignAudio.src = '';
    
    // Flag'leri sıfırla
    this.isAnnouncementPlaying = false;
    
    // Anonsun bittiğini bildir
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('announcement-ended', {
      lastPlaylistIndex: this.lastPlaylistIndex
    });
    
    // Playlist'i devam ettir
    if (this.wasPlaylistPlaying) {
      console.log('Playlist kaldığı yerden devam ediyor');
      
      // Küçük bir gecikme ile playlist'i başlat
      setTimeout(() => {
        this.playlistAudio.play().catch(err => {
          console.error('Playlist devam ettirme hatası:', err);
        });
      }, 500);
    }
    
    // State'i temizle
    this.wasPlaylistPlaying = false;
  }

  async playAnnouncement(audioPath) {
    if (!audioPath) {
      console.error('Anons için ses dosyası yolu bulunamadı');
      return false;
    }

    try {
      console.log('Anons başlatılıyor:', audioPath);
      
      // Önce playlist'i duraklat
      if (!this.playlistAudio.paused) {
        console.log('Playlist duraklatılıyor');
        this.wasPlaylistPlaying = true;
        this.playlistAudio.pause();
      }
      
      // Anons ses dosyasını yükle
      this.campaignAudio.src = audioPath;
      await this.campaignAudio.load();
      
      // Volume'u ayarla ve çal
      const store = new (require('electron-store'))();
      const volume = store.get('volume', 70);
      this.campaignAudio.volume = volume / 100;
      this.campaignAudio.currentTime = 0;
      await this.campaignAudio.play();
      
      return true;
    } catch (err) {
      console.error('Anons başlatma hatası:', err);
      this.resetAnnouncementState();
      return false;
    }
  }

  isPlaying() {
    return this.isAnnouncementPlaying;
  }
}

module.exports = AnnouncementEventHandler;