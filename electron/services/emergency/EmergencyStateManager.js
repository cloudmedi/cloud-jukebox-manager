const Store = require('electron-store');
const { BrowserWindow } = require('electron');
const store = new Store();

class EmergencyStateManager {
  constructor() {
    this.store = new Store();
    this.isEmergencyActive = this.store.get('emergencyState.isActive', false);
  }

  setEmergencyState(isActive) {
    console.log('Setting emergency state:', isActive);
    
    this.isEmergencyActive = isActive;
    this.store.set('emergencyState', {
      isActive,
      timestamp: new Date().toISOString()
    });

    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (isActive) {
        mainWindow.webContents.send('show-emergency-message', {
          title: 'Acil Durum Aktif',
          message: 'Müzik yayını geçici olarak durdurulmuştur. Yetkili personel tarafından kontrol edilene kadar yayın yapılamayacaktır.'
        });
      } else {
        mainWindow.webContents.send('hide-emergency-message');
      }
    }
  }

  isEmergencyActive() {
    return this.isEmergencyActive;
  }

  getEmergencyState() {
    return this.store.get('emergencyState');
  }
}

module.exports = new EmergencyStateManager();