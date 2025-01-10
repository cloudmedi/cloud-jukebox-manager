const scheduleStorage = require('./ScheduleStorage');
const schedulePlayer = require('./SchedulePlayer');
const scheduleDownloader = require('./ScheduleDownloadManager');
const { createLogger } = require('../../utils/logger');
const Store = require('electron-store');

const logger = createLogger('schedule-handler');

class ScheduleHandler {
  constructor() {
    this.scheduleStorage = scheduleStorage;
    this.downloadManager = scheduleDownloader;
    this.playlistStore = new Store({ name: 'playlists' });
    this.initialize();
    logger.info('Schedule handler initialized');
  }

  async initialize() {
    // Her saat başı temizlik yap
    setInterval(() => {
      scheduleDownloader.cleanupExpiredSchedules();
    }, 60 * 60 * 1000);
  }

  async handleNewSchedule(schedule) {
    try {
      logger.info(`[Schedule] Received new schedule: ${schedule.id}`);

      // Schedule'ı kaydet
      await this.scheduleStorage.saveSchedule(schedule);

      // Playlist'i store'a kaydet
      if (schedule.playlist) {
        logger.info(`[Schedule] Saving playlist to store: ${schedule.playlist.id}`);
        const playlists = this.playlistStore.get('playlists', []);
        const existingIndex = playlists.findIndex(p => p.id === schedule.playlist.id);

        if (existingIndex !== -1) {
          playlists[existingIndex] = schedule.playlist;
        } else {
          playlists.push(schedule.playlist);
        }

        this.playlistStore.set('playlists', playlists);
        logger.info(`[Schedule] Playlist saved to store: ${schedule.playlist.id}`);
      }

      // Schedule playlist'ini indir
      await this.downloadManager.downloadSchedulePlaylist(schedule);

      // Schedule'ı aktif et
      await this.scheduleStorage.activateSchedule(schedule.id);

      logger.info(`[Schedule] Successfully processed new schedule: ${schedule.id}`);
      return true;
    } catch (error) {
      logger.error(`[Schedule] Error handling new schedule: ${schedule.id}`, error);
      return false;
    }
  }

  async handleScheduleUpdate(schedule) {
    try {
      logger.info(`[Schedule] Updating schedule: ${schedule.id}`);

      // Eski schedule'ı temizle
      await this.downloadManager.cleanupSchedule(schedule.id);

      // Schedule'ı güncelle
      await this.scheduleStorage.saveSchedule(schedule);

      // Playlist'i güncelle
      if (schedule.playlist) {
        logger.info(`[Schedule] Updating playlist in store: ${schedule.playlist.id}`);
        const playlists = this.playlistStore.get('playlists', []);
        const existingIndex = playlists.findIndex(p => p.id === schedule.playlist.id);

        if (existingIndex !== -1) {
          playlists[existingIndex] = schedule.playlist;
        } else {
          playlists.push(schedule.playlist);
        }

        this.playlistStore.set('playlists', playlists);
        logger.info(`[Schedule] Playlist updated in store: ${schedule.playlist.id}`);
      }

      // Yeni schedule'ı indir
      await this.downloadManager.downloadSchedulePlaylist(schedule);

      logger.info(`[Schedule] Successfully updated schedule: ${schedule.id}`);
      return true;
    } catch (error) {
      logger.error(`[Schedule] Error updating schedule: ${schedule.id}`, error);
      return false;
    }
  }

  async handleScheduleDelete(data) {
    try {
      const scheduleId = data?.id;
      
      if (!scheduleId) {
        logger.error('[Schedule] Invalid schedule ID for deletion');
        return;
      }

      logger.info('[Schedule] Deleting schedule:', { scheduleId });

      // Schedule'ı deaktive et
      await this.deactivateSchedule(scheduleId);
      logger.info('Schedule deactivated:', { scheduleId });

      // Schedule'ı storage'dan sil
      await this.scheduleStorage.deleteSchedule(scheduleId);
      logger.info('Schedule deleted:', { scheduleId });

      // İndirilen dosyaları temizle
      await this.downloadManager.cleanupSchedule(scheduleId);

      logger.info('[Schedule] Successfully deleted schedule:', { scheduleId });
    } catch (error) {
      logger.error('[Schedule] Error deleting schedule:', { 
        error: error.message,
        scheduleId: data?.id,
        stack: error.stack 
      });
    }
  }

  async deactivateSchedule(scheduleId) {
    await this.scheduleStorage.deactivateSchedule(scheduleId);
  }

  getScheduleDownloadStatus(scheduleId) {
    return this.downloadManager.getDownloadStatus(scheduleId);
  }
}

module.exports = new ScheduleHandler();
