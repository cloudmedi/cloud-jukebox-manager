const { EventEmitter } = require('events');
const path = require('path');
const scheduleStorage = require('./ScheduleStorage');
const { createLogger } = require('../../utils/logger');
const playbackStateManager = require('../audio/PlaybackStateManager');

const logger = createLogger('schedule-player');

class SchedulePlayer extends EventEmitter {
  constructor(downloadPath) {
    super();
    this.downloadPath = downloadPath;
    this.currentSchedule = null;
    this.errorCount = 0;
    this.maxErrors = 3;
    this.isRetrying = false;
    this.retryTimeout = null;
    this.checkInterval = null;
    this.isCheckingEnabled = true;
    this.boundCheckSchedules = this.checkSchedules.bind(this);
    
    // Event listener'ları sakla
    this.eventListeners = new Map();

    // Schedule kontrolünü başlat
    this.startScheduleCheck();
  }

  startScheduleCheck() {
    // Her 10 saniyede bir schedule kontrolü yap
    this.checkInterval = setInterval(async () => {
      try {
        // Manuel pause durumunu kontrol et ve logla
        const isPaused = await scheduleStorage.isManuallyPaused();
        logger.info('Schedule check - Manual pause status:', isPaused);

        if (isPaused) {
          logger.info('Schedule is manually paused, skipping check');
          return;
        }

        const activeSchedules = await scheduleStorage.getActiveSchedules();
        logger.info('Active schedules:', activeSchedules);

        const now = new Date();
        logger.info('Current time:', now.toISOString());

        // Aktif schedule'ı bul
        const currentSchedule = activeSchedules.find(schedule => {
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);
          const isActive = startDate <= now && endDate >= now;
          
          logger.info('Schedule time check:', {
            scheduleId: schedule.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isActive
          });
          
          return isActive;
        });

        if (currentSchedule) {
          if (!this.currentSchedule || this.currentSchedule.id !== currentSchedule.id) {
            // Yeni schedule başlıyor
            logger.info('Starting new schedule:', currentSchedule);
            await this.startSchedule(currentSchedule);
          }
        } else if (this.currentSchedule) {
          // Schedule bitiyor
          logger.info('Stopping current schedule:', this.currentSchedule.id);
          this.stopSchedule(this.currentSchedule.id);
        } else {
          logger.info('No active schedule found for current time');
        }
      } catch (error) {
        logger.error('Error in schedule check:', error);
        this.handleError(error);
      }
    }, 10000);

    logger.info('Schedule check started with 10 second interval');
  }

  async startSchedule(schedule) {
    try {
      // Manuel pause durumunu kontrol et
      if (scheduleStorage.isManuallyPaused()) {
        logger.info('Schedule is manually paused, cannot start');
        return;
      }

      if (!schedule) {
        throw new Error('Invalid schedule');
      }

      // Schedule detaylarını al
      const playlist = await scheduleStorage.getSchedulePlaylist(schedule.id);
      if (!playlist || !playlist.songs || playlist.songs.length === 0) {
        throw new Error('No songs in schedule playlist');
      }

      // Önce diğer player'ları durdur
      await playbackStateManager.pauseAll();

      this.currentSchedule = {
        ...schedule,
        playlist
      };

      logger.info('Schedule started:', {
        scheduleId: schedule.id,
        songCount: playlist.songs.length
      });

      // Schedule başladı event'ini gönder
      this.emit('schedule-started', {
        scheduleId: schedule.id,
        songCount: playlist.songs.length
      });

      // Schedule player'ı başlat
      await playbackStateManager.play('schedule');

      // İlk şarkıyı başlat
      this.playNextSong();
    } catch (error) {
      logger.error('Error starting schedule:', error);
      this.handleError(error, schedule.id);
    }
  }

  async stopSchedule(scheduleId) {
    try {
      if (this.currentSchedule && this.currentSchedule.id === scheduleId) {
        // Schedule player'ı durdur
        await playbackStateManager.pause('schedule');
        
        this.currentSchedule = null;
        this.errorCount = 0;
        
        logger.info('Schedule stopped:', scheduleId);
        this.emit('schedule-stopped', { scheduleId });
      }
    } catch (error) {
      logger.error('Error stopping schedule:', error);
      this.handleError(error, scheduleId);
    }
  }

  // Event listener ekleme ve saklama
  on(eventName, listener) {
    super.on(eventName, listener);
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(listener);
  }

  // Tüm event listener'ları temizle
  removeAllListeners(eventName) {
    if (eventName && this.eventListeners.has(eventName)) {
      const listeners = this.eventListeners.get(eventName);
      listeners.forEach(listener => super.removeListener(eventName, listener));
      this.eventListeners.delete(eventName);
    } else {
      this.eventListeners.forEach((listeners, event) => {
        listeners.forEach(listener => super.removeListener(event, listener));
      });
      this.eventListeners.clear();
    }
  }

  handleError(error, scheduleId) {
    if (!this.isCheckingEnabled || this.isRetrying) {
      return;
    }

    this.errorCount++;

    if (this.errorCount >= this.maxErrors) {
      // Tüm event listener'ları temizle
      this.removeAllListeners();
      
      // Schedule kontrolünü devre dışı bırak
      this.isCheckingEnabled = false;
      
      // Schedule'ı durdur ve state'i temizle
      this.stopSchedule(scheduleId);
      this.reset();
      
      // Son event'i gönder ve listener'ı temizle
      this.emit('fallback-to-playlist');
      this.removeAllListeners('fallback-to-playlist');
      return;
    }

    if (this.errorCount === 1 && !this.isRetrying) {
      this.isRetrying = true;
      this.retryTimeout = setTimeout(() => {
        this.isRetrying = false;
        this.startSchedule(scheduleId);
      }, 30 * 1000);
    }
  }

  reset() {
    // Tüm zamanlayıcıları temizle
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // State'i sıfırla
    this.currentSchedule = null;
    this.errorCount = 0;
    this.isRetrying = false;
    
    // Event listener'ları temizle
    this.removeAllListeners();
  }

  async checkSchedules() {
    // Kontrol devre dışıysa çalışma
    if (!this.isCheckingEnabled) {
      return;
    }

    try {
      const activeSchedules = await scheduleStorage.getActiveSchedules();
      const now = new Date();

      for (const schedule of activeSchedules) {
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);

        if (startDate <= now && endDate >= now && 
            (!this.currentSchedule || this.currentSchedule.id !== schedule.id)) {
          // Schedule objesini doğrudan geçir
          await this.startSchedule(schedule);
        }
        else if (this.currentSchedule && this.currentSchedule.id === schedule.id && 
                 (now < startDate || now > endDate)) {
          this.stopSchedule(schedule.id);
        }
      }
    } catch (error) {
      logger.error('Error checking schedules:', error);
      this.handleError(error);
    }
  }

  initialize() {
    // Önceki state'i temizle
    this.reset();
    
    // Yeni state'i ayarla
    this.isCheckingEnabled = true;
    this.errorCount = 0;
    
    // Schedule kontrolünü başlat
    if (!this.checkInterval) {
      this.checkInterval = setInterval(this.boundCheckSchedules, 60 * 1000);
    }
    
    // İlk kontrolü yap
    this.checkSchedules();
  }

  getCurrentSchedule() {
    return this.currentSchedule;
  }

  destroy() {
    // Tüm kaynakları temizle
    this.reset();
    
    // Bound fonksiyonu temizle
    this.boundCheckSchedules = null;
  }

  playNextSong() {
    if (!this.currentSchedule || !this.currentSchedule.playlist || !this.currentSchedule.playlist.songs) {
      logger.error('No current schedule or playlist');
      return;
    }

    const songs = this.currentSchedule.playlist.songs;
    if (songs.length === 0) {
      logger.error('No songs in playlist');
      return;
    }

    // Çalınacak şarkıyı seç
    const currentSong = songs[0];
    
    // Şarkıyı çal event'ini gönder
    this.emit('play-song', {
      scheduleId: this.currentSchedule.id,
      song: currentSong
    });

    // Şarkıyı playlist'in sonuna taşı (döngüsel çalma)
    songs.push(songs.shift());

    logger.info('Playing song:', {
      scheduleId: this.currentSchedule.id,
      songName: currentSong.name,
      songPath: currentSong.url
    });
  }
}

module.exports = SchedulePlayer;
