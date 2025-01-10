const { ipcRenderer } = require('electron');
const winston = require('winston');

// Logger konfigürasyonu
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
});

class ScheduleEventHandler {
  constructor(playlistAudio, scheduleAudio) {
    this.playlistAudio = playlistAudio;
    this.scheduleAudio = scheduleAudio;
    this.isSchedulePlaying = false;
    this.wasPlaylistPlaying = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Schedule başladığında
    this.scheduleAudio.addEventListener('play', () => {
      logger.info('[Schedule Audio] Schedule başladı, playlist duraklatılıyor');
      this.isSchedulePlaying = true;
      
      // Playlist'in mevcut durumunu kaydet
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      
      // Playlist'i duraklat
      if (this.wasPlaylistPlaying) {
        this.playlistAudio.pause();
      }
    });

    // Schedule bittiğinde
    this.scheduleAudio.addEventListener('ended', () => {
      logger.info('[Schedule Audio] Schedule bitti, temizleniyor');
      this.cleanupSchedule();
    });

    // Schedule hata durumunda
    this.scheduleAudio.addEventListener('error', (error) => {
      logger.error('[Schedule Audio] Schedule oynatma hatası:', error);
      this.cleanupSchedule();
    });
  }

  cleanupSchedule() {
    logger.info('[Schedule Audio] Schedule durumu temizleniyor');
    
    // Schedule audio elementini temizle
    this.scheduleAudio.src = '';
    this.isSchedulePlaying = false;
    
    // Schedule bittiğini bildir
    ipcRenderer.send('schedule-ended');
    
    // Eğer playlist çalıyorduysa devam ettir
    if (this.wasPlaylistPlaying) {
      logger.info('[Schedule Audio] Playlist kaldığı yerden devam ediyor');
      this.playlistAudio.play().catch(err => {
        logger.error('[Schedule Audio] Playlist devam hatası:', err);
      });
    }
  }

  async playSchedule(audioPath) {
    try {
      if (this.isSchedulePlaying) {
        logger.info('[Schedule Audio] Zaten bir schedule çalıyor');
        return false;
      }

      logger.info(`[Schedule Audio] Schedule başlatılıyor: ${audioPath}`);
      
      // Audio source'u ayarla
      this.scheduleAudio.src = audioPath;
      
      // Schedule'ı başlat
      await this.scheduleAudio.play();
      
      return true;
    } catch (error) {
      logger.error('[Schedule Audio] Schedule oynatma hatası:', error);
      this.cleanupSchedule();
      return false;
    }
  }

  isPlaying() {
    return this.isSchedulePlaying;
  }
}

module.exports = ScheduleEventHandler;
