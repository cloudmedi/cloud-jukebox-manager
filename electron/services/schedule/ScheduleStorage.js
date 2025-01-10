const Store = require('electron-store');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('schedule-storage');

class ScheduleStorage {
  constructor() {
    this.store = new Store({
      name: 'schedules', // Ayrı bir store dosyası
      defaults: {
        schedules: [],
        activeSchedules: []
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
      // Doğrudan schedule store'dan veriyi al
      const schedule = await this.getSchedule(scheduleId);
      if (!schedule || !schedule.playlist) {
        logger.error('Schedule or playlist not found:', scheduleId);
        return null;
      }

      // Store'daki playlist'i kullan (localPath'ler burada)
      const playlist = schedule.playlist;

      // Şarkı yollarını düzelt
      const songs = (playlist.songs || []).map(song => ({
        ...song,
        // Local path varsa onu kullan, yoksa normal path'i kullan
        url: song.localPath ? `file://${song.localPath}` : (song.url || song.path)
      }));

      logger.info('Retrieved schedule playlist:', {
        scheduleId,
        playlistId: playlist.id,
        songCount: songs.length,
        songs: songs.map(s => ({ 
          id: s.id, 
          name: s.name, 
          url: s.url,
          hasLocalPath: !!s.localPath 
        }))
      });

      return {
        ...playlist,
        songs,
        status: 'active'
      };
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
      const activeIds = this.store.get('activeSchedules', []);
      const schedules = this.store.get('schedules', []);
      
      logger.info('Getting active schedules:', { 
        activeIds, 
        totalSchedules: schedules.length 
      });
      
      const activeSchedules = schedules.filter(s => activeIds.includes(s.id));
      
      logger.info('Found active schedules:', {
        count: activeSchedules.length,
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
}

module.exports = new ScheduleStorage();
