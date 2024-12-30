class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.lastPlaylistIndex = 0;
    this.announcementEndListener = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya yüklendiğinde
    this.campaignAudio.addEventListener('loadeddata', () => {
      console.log('Anons yüklendi, playlist durumu kontrol ediliyor');
      
      // Playlist durumunu ve mevcut şarkı indeksini bir kez kaydet
      if (!this.isAnnouncementPlaying) {
        this.wasPlaylistPlaying = !this.playlistAudio.paused;
        
        // Mevcut şarkı indeksini bir kez kaydet
        const currentPlaylist = require('electron').ipcRenderer.sendSync('get-current-playlist');
        if (currentPlaylist) {
          this.lastPlaylistIndex = currentPlaylist.currentIndex;
        }
      }

      if (this.wasPlaylistPlaying) {
        this.playlistAudio.pause();
      }
    });

    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      if (!this.isAnnouncementPlaying) {
        console.log('Anons başladı');
        this.isAnnouncementPlaying = true;
        
        if (!this.playlistAudio.paused) {
          this.playlistAudio.pause();
        }
      }
    });

    // Kampanya bittiğinde
    this.campaignAudio.addEventListener('ended', () => {
      if (this.isAnnouncementPlaying) {
        console.log('Anons bitti, temizleme başlıyor');
        this.resetAnnouncementState();
      }
    });

    // Kampanya hata durumunda
    this.campaignAudio.addEventListener('error', (error) => {
      if (this.isAnnouncementPlaying) {
        console.error('Anons oynatma hatası:', error);
        this.resetAnnouncementState();
      }
    });
  }

  resetAnnouncementState() {
    if (!this.isAnnouncementPlaying) return;

    console.log('Anons durumu sıfırlanıyor');
    
    // Kampanyayı duraklat ve zamanı sıfırla
    this.campaignAudio.pause();
    this.campaignAudio.currentTime = 0;
    this.campaignAudio.src = '';
    
    // Flag'leri sıfırla
    this.isAnnouncementPlaying = false;
    
    // Anonsun bittiğini bir kez bildir
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('announcement-ended', {
      lastPlaylistIndex: this.lastPlaylistIndex
    });
    
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
      if (this.isAnnouncementPlaying) {
        await this.resetAnnouncementState();
      }

      console.log('Anons başlatılıyor:', audioPath);
      
      // Önce playlist'i duraklat
      if (!this.playlistAudio.paused) {
        this.wasPlaylistPlaying = true;
        this.playlistAudio.pause();
      }
      
      // Her seferinde src'yi yeniden ayarla
      this.campaignAudio.src = audioPath;
      
      // Ses dosyasını yükle ve çal
      await this.campaignAudio.load();
      this.campaignAudio.currentTime = 0;
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