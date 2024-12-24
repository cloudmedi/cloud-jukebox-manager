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

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Anons audio event listeners
    this.announcementAudio.addEventListener('play', () => {
      console.log('Anons başladı');
      this.isAnnouncementPlaying = true;
      
      // Playlist çalıyorsa durdur
      if (!this.playlistAudio.paused) {
        this.wasPlaylistPlaying = true;
        this.playlistAudio.pause();
      }
    });

    this.announcementAudio.addEventListener('ended', () => {
      console.log('Anons bitti');
      this.isAnnouncementPlaying = false;
      
      // Eğer playlist çalıyorduysa devam et
      if (this.wasPlaylistPlaying) {
        this.playlistAudio.play();
        this.wasPlaylistPlaying = false;
      }
    });

    this.announcementAudio.addEventListener('error', (error) => {
      console.error('Anons çalma hatası:', error);
      this.isAnnouncementPlaying = false;
      
      // Hata durumunda da playlist'e devam et
      if (this.wasPlaylistPlaying) {
        this.playlistAudio.play();
        this.wasPlaylistPlaying = false;
      }
    });

    // Playlist audio event listeners
    this.playlistAudio.addEventListener('ended', () => {
      if (!this.isAnnouncementPlaying) {
        console.log('Şarkı bitti, sıradakine geçiliyor');
        ipcRenderer.invoke('song-ended');
      }
    });
  }

  async playAnnouncement(announcement) {
    try {
      if (!announcement.localPath) {
        throw new Error('Anons dosya yolu bulunamadı');
      }

      // Playlist durumunu kaydet ve durdur
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      this.playlistAudio.pause();

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

  resumePlaylistIfNeeded() {
    if (this.wasPlaylistPlaying) {
      this.playlistAudio.play().catch(err => {
        console.error('Playlist devam ettirme hatası:', err);
      });
      this.wasPlaylistPlaying = false;
    }
  }

  // Playlist kontrolleri
  playPlaylist(src) {
    if (!this.isAnnouncementPlaying) {
      this.playlistAudio.src = src;
      return this.playlistAudio.play();
    }
    return Promise.reject(new Error('Anons çalıyor'));
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