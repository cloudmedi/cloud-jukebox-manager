const { ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();

class EmergencyHandler {
  constructor(audioPlayer) {
    this.audioPlayer = audioPlayer;
    this.setupHandlers();
  }

  setupHandlers() {
    ipcMain.on('emergency-stop', () => {
      console.log('Emergency stop received');
      this.audioPlayer.handleEmergencyStop();
    });

    ipcMain.on('emergency-reset', () => {
      console.log('Emergency reset received');
      this.audioPlayer.handleEmergencyReset();
    });
  }
}

module.exports = EmergencyHandler;