const Store = require('electron-store');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('schedule-storage');

class ScheduleStorage {
  constructor() {
    this.store = new Store({
      name: 'schedules', // Ayrı bir store dosyası
      defaults: {
        schedules: [],
        activeSchedules: [],
        manuallyPaused: false
      }
    });
    logger.info('Schedule storage initialized');
  }

  async saveSchedule(schedule) {
    try {
      const schedules = this.store.get('schedules', []);
      const index = schedules.findIndex(s => s.id === schedule.id);

      if (index !== -1) {
        schedules[index] = schedule;
        logger.info(`Schedule updated: ${schedule.id}`);
      } else {
        schedules.push(schedule);
        logger.info(`Schedule saved: ${schedule.id}`);
      }

      this.store.set('schedules', schedules);
      return true;
    } catch (error) {
      logger.error('Error saving schedule:', error);
      return false;
    }
  }

  async getSchedule(scheduleId) {
    try {
      const schedules = this.store.get('schedules', []);
      return schedules.find(s => s.id === scheduleId);
    } catch (error) {
      logger.error('Error getting schedule:', error);
      return null;
    }
  }

  async getSchedulePlaylist(scheduleId) {
    try {
      const schedule = await this.getSchedule(scheduleId);
      if (!schedule || !schedule.playlist) {
        return null;
      }
      return schedule.playlist;
    } catch (error) {
      logger.error('Error getting schedule playlist:', error);
      return null;
    }
  }

  async deleteSchedule(scheduleId) {
    try {
      const schedules = this.store.get('schedules', []);
      const updatedSchedules = schedules.filter(s => s.id !== scheduleId);
      this.store.set('schedules', updatedSchedules);

      // Aktif schedule'lardan da kaldır
      const activeSchedules = this.store.get('activeSchedules', []);
      const updatedActiveSchedules = activeSchedules.filter(id => id !== scheduleId);
      this.store.set('activeSchedules', updatedActiveSchedules);

      logger.info(`Schedule deleted: ${scheduleId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting schedule:', error);
      return false;
    }
  }

  async getActiveSchedules() {
    try {
      const schedules = this.store.get('schedules', []);
      const activeSchedules = schedules.filter(schedule => {
        const now = new Date();
        const startDate = new Date(schedule.startDate);
        const endDate = new Date(schedule.endDate);
        return startDate <= now && endDate >= now;
      });

      logger.info('Retrieved active schedules:', {
        total: schedules.length,
        active: activeSchedules.length,
        schedules: activeSchedules.map(s => ({
          id: s.id,
          startDate: s.startDate,
          endDate: s.endDate
        }))
      });

      return activeSchedules;
    } catch (error) {
      logger.error('Error getting active schedules:', error);
      return [];
    }
  }

  async activateSchedule(scheduleId) {
    try {
      const activeSchedules = this.store.get('activeSchedules', []);
      if (!activeSchedules.includes(scheduleId)) {
        activeSchedules.push(scheduleId);
        this.store.set('activeSchedules', activeSchedules);
        logger.info(`Schedule activated: ${scheduleId}`);
      }
      return true;
    } catch (error) {
      logger.error('Error activating schedule:', error);
      return false;
    }
  }

  async deactivateSchedule(scheduleId) {
    try {
      const activeSchedules = this.store.get('activeSchedules', []);
      const updatedActiveSchedules = activeSchedules.filter(id => id !== scheduleId);
      this.store.set('activeSchedules', updatedActiveSchedules);
      logger.info(`Schedule deactivated: ${scheduleId}`);
      return true;
    } catch (error) {
      logger.error('Error deactivating schedule:', error);
      return false;
    }
  }

  async clearExpiredSchedules() {
    try {
      const schedules = this.store.get('schedules', []);
      const now = new Date();
      
      logger.info('Clearing expired schedules:', {
        before: schedules.length
      });
      
      const activeSchedules = schedules.filter(schedule => {
        const endDate = new Date(schedule.endDate);
        return endDate >= now;
      });
      
      logger.info('After clearing expired schedules:', {
        after: activeSchedules.length,
        removed: schedules.length - activeSchedules.length
      });

      this.store.set('schedules', activeSchedules);
      
      // Aktif schedule listesini de güncelle
      const activeIds = this.store.get('activeSchedules', []);
      const validActiveIds = activeIds.filter(id => 
        activeSchedules.some(s => s.id === id)
      );
      this.store.set('activeSchedules', validActiveIds);
      
      logger.info('Updated active schedule IDs:', {
        before: activeIds.length,
        after: validActiveIds.length
      });
      
      return true;
    } catch (error) {
      logger.error('Error clearing expired schedules:', error);
      return false;
    }
  }

  // Manuel pause durumunu ayarla
  setManuallyPaused(paused) {
    try {
      logger.info('Setting manually paused state:', paused);
      const oldState = this.store.get('manuallyPaused', false);
      this.store.set('manuallyPaused', paused);
      logger.info(`Schedule manually paused state changed: ${oldState} -> ${paused}`);
      return true;
    } catch (error) {
      logger.error('Error setting manually paused state:', error);
      return false;
    }
  }

  // Manuel pause durumunu kontrol et
  isManuallyPaused() {
    try {
      const paused = this.store.get('manuallyPaused', false);
      logger.info('Current manually paused state:', paused);
      return paused;
    } catch (error) {
      logger.error('Error getting manually paused state:', error);
      return false;
    }
  }
}

module.exports = new ScheduleStorage();
