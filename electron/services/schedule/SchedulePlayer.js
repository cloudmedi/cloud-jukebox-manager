const { EventEmitter } = require('events');
const path = require('path');
const scheduleStorage = require('./ScheduleStorage');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('schedule-player');

const MAX_CONSECUTIVE_ERRORS = 3;
const ERROR_RESET_INTERVAL = 5 * 60 * 1000; // 5 dakika

class SchedulePlayer extends EventEmitter {
  constructor(downloadPath) {
    super();
    this.currentSchedule = null;
    this.checkInterval = null;
    this.downloadPath = downloadPath;
    this.consecutiveErrors = 0;
    this.lastErrorTime = null;
    this.errorResetTimeout = null;
    this.initialize();
    logger.info('Schedule player initialized');
  }

  initialize() {
    // Her dakika schedule'ları kontrol et
    this.checkInterval = setInterval(() => {
      this.checkSchedules();
    }, 60 * 1000);

    // Başlangıçta bir kere kontrol et
    this.checkSchedules();
  }

  handleError(error, scheduleId) {
    const now = Date.now();

    // Son hata üzerinden 5 dakika geçtiyse sayacı sıfırla
    if (this.lastErrorTime && (now - this.lastErrorTime) > ERROR_RESET_INTERVAL) {
      this.consecutiveErrors = 0;
      if (this.errorResetTimeout) {
        clearTimeout(this.errorResetTimeout);
        this.errorResetTimeout = null;
      }
    }

    this.consecutiveErrors++;
    this.lastErrorTime = now;

    // Hata sayacını sıfırlamak için zamanlayıcı ayarla
    if (!this.errorResetTimeout) {
      this.errorResetTimeout = setTimeout(() => {
        this.consecutiveErrors = 0;
        this.lastErrorTime = null;
        this.errorResetTimeout = null;
      }, ERROR_RESET_INTERVAL);
    }

    // Ardışık hata limiti aşıldıysa schedule'ı durdur
    if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      logger.error('Too many consecutive errors, stopping schedule playback');
      this.emit('schedule-error', { 
        message: 'Too many playback errors, stopping schedule', 
        scheduleId 
      });
      this.stopSchedule(scheduleId);
      
      // Schedule kontrolünü durdur
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      // 5 dakika sonra yeniden başlat
      setTimeout(() => {
        this.consecutiveErrors = 0;
        this.lastErrorTime = null;
        if (this.errorResetTimeout) {
          clearTimeout(this.errorResetTimeout);
          this.errorResetTimeout = null;
        }
        
        // Schedule kontrolünü yeniden başlat
        this.checkInterval = setInterval(() => {
          this.checkSchedules();
        }, 60 * 1000);
        
        // Hemen bir kontrol yap
        this.checkSchedules();
      }, ERROR_RESET_INTERVAL);
    } else {
      // Normal hata bildirimi
      this.emit('schedule-error', { 
        message: error.message || 'Schedule playback error', 
        scheduleId 
      });
    }
  }

  async checkSchedules() {
    try {
      // Eğer çok fazla hata varsa kontrol etmeyi durdur
      if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        return;
      }

      const activeSchedules = await scheduleStorage.getActiveSchedules();
      const now = new Date();

      // Aktif schedule'ları kontrol et
      for (const schedule of activeSchedules) {
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);

        // Schedule zamanı geldiyse ve şu an çalışan schedule değilse
        if (startDate <= now && endDate >= now && (!this.currentSchedule || this.currentSchedule.id !== schedule.id)) {
          const success = await this.startSchedule(schedule.id);
          if (!success) {
            this.handleError(new Error('Failed to start schedule'), schedule.id);
            // Hata durumunda diğer schedule'ları kontrol etmeyi bırak
            return;
          }
        }
        // Mevcut schedule'ın süresi bittiyse
        else if (this.currentSchedule && this.currentSchedule.id === schedule.id && endDate < now) {
          const success = await this.stopSchedule(schedule.id);
          if (!success) {
            this.handleError(new Error('Failed to stop schedule'), schedule.id);
            // Hata durumunda diğer schedule'ları kontrol etmeyi bırak
            return;
          }
        }
      }

      // Süresi bitmiş schedule'ları temizle
      await scheduleStorage.clearExpiredSchedules();
    } catch (error) {
      logger.error('Error checking schedules:', error);
      if (this.currentSchedule) {
        this.handleError(error, this.currentSchedule.id);
      }
    }
  }

  async startSchedule(scheduleId) {
    try {
      logger.info('Starting schedule:', { scheduleId });
      
      const schedule = await scheduleStorage.getSchedule(scheduleId);
      if (!schedule) {
        logger.error(`Schedule not found: ${scheduleId}`);
        return false;
      }

      logger.info('Schedule details:', {
        id: schedule.id,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        playlist: schedule.playlist ? {
          id: schedule.playlist.id,
          name: schedule.playlist.name,
          songCount: schedule.playlist.songs?.length
        } : null
      });

      // Playlist ve şarkı kontrolü
      if (!schedule.playlist || !schedule.playlist.songs || !Array.isArray(schedule.playlist.songs) || schedule.playlist.songs.length === 0) {
        logger.info('No songs in schedule');
        this.handleError(new Error('No songs in schedule'), scheduleId);
        return false;
      }

      // Mevcut çalan schedule varsa durdur
      if (this.currentSchedule) {
        logger.info('Stopping current schedule before starting new one');
        await this.stopSchedule(this.currentSchedule.id);
      }

      logger.info(`Starting schedule: ${scheduleId}`);
      this.currentSchedule = schedule;

      // Schedule başladı event'ini gönder
      const scheduleData = {
        id: scheduleId,
        schedule: schedule,
        songs: schedule.playlist.songs.map(song => ({
          id: song.id,
          name: song.name,
          artist: song.artist,
          path: path.join(this.downloadPath, scheduleId, `${song.id}.mp3`)
        }))
      };

      logger.info('Emitting schedule-started event:', {
        id: scheduleId,
        songCount: scheduleData.songs.length
      });

      this.emit('schedule-started', scheduleData);
      return true;
    } catch (error) {
      logger.error('Error starting schedule:', error);
      this.handleError(error, scheduleId);
      return false;
    }
  }

  async stopSchedule(scheduleId) {
    try {
      if (!this.currentSchedule || this.currentSchedule.id !== scheduleId) {
        return false;
      }

      logger.info(`Stopping schedule: ${scheduleId}`);

      // Schedule durdu event'ini gönder
      this.emit('schedule-stopped', scheduleId);
      
      this.currentSchedule = null;

      // Schedule deaktif et
      await scheduleStorage.deactivateSchedule(scheduleId);

      // Hata sayaçlarını sıfırla
      this.consecutiveErrors = 0;
      this.lastErrorTime = null;
      if (this.errorResetTimeout) {
        clearTimeout(this.errorResetTimeout);
        this.errorResetTimeout = null;
      }

      return true;
    } catch (error) {
      logger.error('Error stopping schedule:', error);
      this.handleError(error, scheduleId);
      return false;
    }
  }

  getCurrentSchedule() {
    return this.currentSchedule;
  }

  getSchedulePath(scheduleId) {
    return path.join(this.downloadPath, scheduleId);
  }

  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.errorResetTimeout) {
      clearTimeout(this.errorResetTimeout);
    }
  }
}

module.exports = SchedulePlayer;
