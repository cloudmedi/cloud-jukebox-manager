const Store = require('electron-store');
const store = new Store();

class EmergencyStateManager {
  constructor() {
    this.store = new Store();
    this.isEmergencyActive = this.store.get('emergencyState.isActive', false);
  }

  static setEmergencyState(isActive) {
    const instance = new EmergencyStateManager();
    instance.isEmergencyActive = isActive;
    instance.store.set('emergencyState', {
      isActive,
      timestamp: new Date().toISOString()
    });
  }

  static isActive() {
    const instance = new EmergencyStateManager();
    return instance.isEmergencyActive;
  }

  static getState() {
    const instance = new EmergencyStateManager();
    return instance.store.get('emergencyState');
  }
}

module.exports = EmergencyStateManager;