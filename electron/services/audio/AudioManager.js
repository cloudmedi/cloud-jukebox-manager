class AudioManager {
  constructor() {
    // Playlist için audio element
    this.playlistAudio = new Audio();
    this.playlistAudio.volume = 0.7; // Başlangıç ses seviyesi 70%

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

    // Volume change event listeners
    this.playlistAudio.addEventListener('volumechange', () => {
      console.log('Playlist volume changed:', this.playlistAudio.volume);
    });

    this.announcementAudio.addEventListener('volumechange', () => {
      console.log('Announcement volume changed:', this.announcementAudio.volume);
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
        console.log('Playing playlist from source:', src);
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
    console.log('Pausing playlist');
    this.playlistAudio.pause();
  }

  setPlaylistVolume(volume) {
    console.log('Setting playlist volume to:', volume);
    // Volume değerini 0-1 aralığına normalize et
    const normalizedVolume = Math.min(Math.max(volume / 100, 0), 1);
    this.playlistAudio.volume = normalizedVolume;
    console.log('New playlist volume:', this.playlistAudio.volume);
  }

  getPlaylistVolume() {
    // Volume değerini 0-100 aralığına çevir
    return Math.round(this.playlistAudio.volume * 100);
  }

  setAnnouncementVolume(volume) {
    console.log('Setting announcement volume to:', volume);
    // Volume değerini 0-1 aralığına normalize et
    const normalizedVolume = Math.min(Math.max(volume / 100, 0), 1);
    this.announcementAudio.volume = normalizedVolume;
    console.log('New announcement volume:', this.announcementAudio.volume);
  }

  getAnnouncementVolume() {
    // Volume değerini 0-100 aralığına çevir
    return Math.round(this.announcementAudio.volume * 100);
  }

  getPlaylistAudio() {
    return this.playlistAudio;
  }

  getAnnouncementAudio() {
    return this.announcementAudio;
  }
}

module.exports = new AudioManager();