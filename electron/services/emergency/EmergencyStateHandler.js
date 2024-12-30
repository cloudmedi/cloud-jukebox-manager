const Store = require('electron-store');
const store = new Store();

class EmergencyStateHandler {
  constructor() {
    this.store = store;
  }

  isEmergencyActive() {
    const emergencyState = this.store.get('emergencyState');
    return emergencyState && emergencyState.isActive;
  }

  handleEmergencyState(audioPlayer, showEmergencyMessage) {
    if (this.isEmergencyActive()) {
      console.log('Emergency state is active on startup');
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.volume = 0;
      }
      showEmergencyMessage();
      return true;
    }
    return false;
  }
}

module.exports = new EmergencyStateHandler();