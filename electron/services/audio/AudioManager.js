class AudioManager {
  constructor() {
    // Playlist için audio element
    this.playlistAudio = new Audio();
    this.playlistAudio.volume = 0.7;

    // Anons için ayrı audio element
    this.announcementAudio = new Audio();
    this.announcementAudio.volume = 1.0;

    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.lastPlaylistSource = null;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Anons audio event listeners
    this.announcementAudio.addEventListener('play', () => {
      console.log('Anons başladı');
      this.isAnnouncementPlaying = true;
      
      // Playlist çalıyorsa durdur ve durumu kaydet
      if (!this.playlistAudio.paused) {
        this.wasPlaylistPlaying = true;
        this.lastPlaylistSource = this.playlistAudio.src;
        this.playlistAudio.pause();
      }
    });

    this.announcementAudio.addEventListener('ended', () => {
      console.log('Anons bitti');
      this.isAnnouncementPlaying = false;
      
      // Playlist'i devam ettir
      this.resumePlaylistIfNeeded();
    });

    this.announcementAudio.addEventListener('error', (error) => {
      console.error('Anons çalma hatası:', error);
      this.isAnnouncementPlaying = false;
      
      // Hata durumunda da playlist'i devam ettir
      this.resumePlaylistIfNeeded();
    });
  }

  async resumePlaylistIfNeeded() {
    if (this.wasPlaylistPlaying && this.lastPlaylistSource) {
      try {
        console.log('Playlist devam ediyor...');
        
        // Audio element'i yeniden hazırla
        this.playlistAudio.src = this.lastPlaylistSource;
        
        // Play promise'i bekle
        await this.playlistAudio.play();
        
        // Başarılı oynatma sonrası state'i temizle
        this.wasPlaylistPlaying = false;
        console.log('Playlist başarıyla devam ediyor');
      } catch (error) {
        console.error('Playlist devam ettirme hatası:', error);
        // 3 kez deneme yap
        for (let i = 0; i < 3; i++) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.playlistAudio.play();
            this.wasPlaylistPlaying = false;
            console.log('Playlist yeniden deneme başarılı');
            break;
          } catch (retryError) {
            console.error(`Yeniden deneme ${i + 1} başarısız:`, retryError);
          }
        }
      }
    }
  }

  async playAnnouncement(announcement) {
    try {
      if (!announcement.localPath) {
        throw new Error('Anons dosya yolu bulunamadı');
      }

      // Playlist durumunu kaydet ve durdur
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      if (this.wasPlaylistPlaying) {
        this.lastPlaylistSource = this.playlistAudio.src;
        this.playlistAudio.pause();
      }

      // Anonsu çal
      this.announcementAudio.src = announcement.localPath;
      await this.announcementAudio.play();

      return true;
    } catch (error) {
      console.error('Anons çalma hatası:', error);
      this.resumePlaylistIfNeeded();
      return false;
    }
  }

  // Playlist kontrolleri
  async playPlaylist(src) {
    if (!this.isAnnouncementPlaying) {
      try {
        this.playlistAudio.src = src;
        this.lastPlaylistSource = src;
        await this.playlistAudio.play();
        return true;
      } catch (error) {
        console.error('Playlist çalma hatası:', error);
        return false;
      }
    }
    return false;
  }

  pausePlaylist() {
    this.playlistAudio.pause();
  }

  setPlaylistVolume(volume) {
    this.playlistAudio.volume = volume;
  }

  getPlaylistAudio() {
    return this.playlistAudio;
  }
}

module.exports = new AudioManager();