class AudioManager {
  constructor() {
    this.playlistAudio = new Audio();
    this.playlistAudio.volume = 0.7;

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
      
      // Playlist çalıyorsa durdur ve durumu kaydet
      if (!this.playlistAudio.paused) {
        this.wasPlaylistPlaying = true;
        this.playlistAudio.pause();
      }
    });

    this.announcementAudio.addEventListener('ended', () => {
      console.log('Anons bitti');
      // Önce anons durumunu güncelle
      this.isAnnouncementPlaying = false;
      
      // Sonra playlist'i devam ettir
      if (this.wasPlaylistPlaying) {
        console.log('Playlist devam ediyor');
        this.playlistAudio.play().catch(err => {
          console.error('Playlist devam ettirme hatası:', err);
        });
        this.wasPlaylistPlaying = false;
      }
    });

    this.announcementAudio.addEventListener('error', (error) => {
      console.error('Anons çalma hatası:', error);
      this.isAnnouncementPlaying = false;
      
      if (this.wasPlaylistPlaying) {
        this.playlistAudio.play().catch(err => {
          console.error('Playlist devam ettirme hatası:', err);
        });
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
      if (this.wasPlaylistPlaying) {
        this.playlistAudio.pause();
      }

      // Anonsu çal
      this.announcementAudio.src = announcement.localPath;
      await this.announcementAudio.play();

      return true;
    } catch (error) {
      console.error('Anons çalma hatası:', error);
      this.isAnnouncementPlaying = false;
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