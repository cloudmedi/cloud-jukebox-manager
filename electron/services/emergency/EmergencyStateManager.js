const Store = require('electron-store');
const store = new Store();

class EmergencyStateManager {
  constructor() {
    this.store = new Store();
    this.isEmergencyActive = this.store.get('emergencyState.isActive', false);
  }

  setEmergencyState(isActive) {
    this.isEmergencyActive = isActive;
    this.store.set('emergencyState', {
      isActive,
      timestamp: new Date().toISOString()
    });
  }

  isActive() {
    return this.isEmergencyActive;
  }

  getState() {
    return this.store.get('emergencyState');
  }
}

module.exports = new EmergencyStateManager();