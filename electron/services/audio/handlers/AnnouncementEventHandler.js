const VolumeManager = require('../VolumeManager');

class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.volumeManager = VolumeManager;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.lastAnnouncementTime = 0;
    this.lastPlaylistIndex = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Kampanya yüklendiğinde
    this.campaignAudio.addEventListener('loadeddata', () => {
      console.log('Kampanya yüklendi, playlist durumu kontrol ediliyor');
      
      // Playlist durumunu ve mevcut şarkı indeksini kaydet
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      
      // Mevcut şarkı indeksini kaydet
      const currentPlaylist = require('electron').ipcRenderer.sendSync('get-current-playlist');
      if (currentPlaylist) {
        this.lastPlaylistIndex = currentPlaylist.currentIndex;
        console.log('Kaydedilen playlist indeksi:', this.lastPlaylistIndex);
      }

      // Kayıtlı ses seviyesini ayarla
      const savedVolume = this.volumeManager.getStoredVolume();
      this.campaignAudio.volume = this.volumeManager.normalizeVolume(savedVolume);

      if (this.wasPlaylistPlaying) {
        console.log('Playlist duraklatılıyor');
        this.playlistAudio.pause();
      }
    });

    // Kampanya başladığında
    this.campaignAudio.addEventListener('play', () => {
      console.log('Kampanya başladı');
      this.isAnnouncementPlaying = true;
      
      // Eğer playlist hala çalıyorsa, duraklat
      if (!this.playlistAudio.paused) {
        console.log('Playlist zorla duraklatılıyor');
        this.playlistAudio.pause();
      }
    });

    // Kampanya bittiğinde
    this.campaignAudio.addEventListener('ended', () => {
      console.log('Kampanya bitti, temizleme başlıyor');
      this.resetAnnouncementState();
    });

    // Kampanya hata durumunda
    this.campaignAudio.addEventListener('error', (error) => {
      console.error('Kampanya oynatma hatası:', error);
      this.resetAnnouncementState();
    });
  }

  resetAnnouncementState() {
    console.log('Kampanya durumu sıfırlanıyor');
    console.log('Önceki playlist durumu:', this.wasPlaylistPlaying);
    console.log('Son playlist indeksi:', this.lastPlaylistIndex);
    
    // Kampanyayı duraklat ve zamanı sıfırla
    this.campaignAudio.pause();
    this.campaignAudio.currentTime = 0;
    
    // Flag'leri sıfırla
    this.isAnnouncementPlaying = false;
    
    // Son anons zamanını kaydet
    this.lastAnnouncementTime = Date.now();
    
    // Anonsun bittiğini bildir
    const ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('announcement-ended', {
      lastPlaylistIndex: this.lastPlaylistIndex
    });
    
    // Playlist'i devam ettir
    if (this.wasPlaylistPlaying) {
      console.log('Playlist kaldığı yerden devam ediyor, indeks:', this.lastPlaylistIndex);
      setTimeout(() => {
        this.playlistAudio.play().catch(err => {
          console.error('Playlist devam ettirme hatası:', err);
        });
      }, 500);
    }
    
    // wasPlaylistPlaying durumunu sıfırla
    this.wasPlaylistPlaying = false;
  }

  async playAnnouncement(audioPath) {
    if (!audioPath) {
      console.error('Kampanya için ses dosyası yolu bulunamadı');
      return false;
    }

    try {
      console.log('Kampanya başlatılıyor:', audioPath);
      
      // Önce playlist'i duraklat
      if (!this.playlistAudio.paused) {
        console.log('Playlist duraklatılıyor');
        this.wasPlaylistPlaying = true;
        this.playlistAudio.pause();
      }
      
      // Her seferinde src'yi yeniden ayarla
      this.campaignAudio.src = audioPath;
      
      // Ses dosyasını yükle ve çal
      await this.campaignAudio.load();
      this.campaignAudio.currentTime = 0;

      // Kayıtlı ses seviyesini ayarla
      const savedVolume = this.volumeManager.getStoredVolume();
      this.campaignAudio.volume = this.volumeManager.normalizeVolume(savedVolume);
      
      await this.campaignAudio.play();
      
      return true;
    } catch (err) {
      console.error('Kampanya başlatma hatası:', err);
      this.resetAnnouncementState();
      return false;
    }
  }

  isPlaying() {
    return this.isAnnouncementPlaying;
  }
}

module.exports = AnnouncementEventHandler;