const { ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();

class ScheduleService {
  constructor() {
    this.store = store;
    this.setupIpcHandlers();
    console.log('Schedule service initialized');
  }

  setupIpcHandlers() {
    // Renderer process'ten gelen schedule isteklerini dinle
    ipcMain.handle('get-schedules', () => {
      return this.store.get('schedules', []);
    });

    ipcMain.handle('get-schedule', (event, scheduleId) => {
      const schedules = this.store.get('schedules', []);
      return schedules.find(s => s.id === scheduleId);
    });
  }

  getActiveSchedules() {
    const now = new Date();
    const schedules = this.store.get('schedules', []);
    
    return schedules.filter(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      return now >= startDate && now <= endDate;
    });
  }
}

// Class'ı export et, instance'ı değil
module.exports = ScheduleService;
