const { BrowserWindow } = require('electron');
const EmergencyStateManager = require('../../emergency/EmergencyStateManager');

class CommandHandler {
  static handleCommand(message) {
    console.log('Processing command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (!mainWindow) {
      console.log('No main window found');
      return;
    }

    switch (message.command) {
      case 'emergency-stop':
        console.log('Processing emergency stop command');
        EmergencyStateManager.setEmergencyState(true);
        mainWindow.webContents.send('emergency-stop');
        break;

      case 'emergency-reset':
        console.log('Processing emergency reset command');
        EmergencyStateManager.setEmergencyState(false);
        mainWindow.webContents.send('emergency-reset');
        break;

      case 'songRemoved':
        console.log('Handling songRemoved command:', message.data);
        mainWindow.webContents.send('songRemoved', {
          songId: message.data.songId,
          playlistId: message.data.playlistId
        });
        break;

      case 'deleteAnnouncement':
        console.log('Processing deleteAnnouncement command:', message);
        mainWindow.webContents.send('deleteAnnouncement', message.data);
        break;
        
      case 'restart':
        console.log('Restarting application...');
        require('electron').app.relaunch();
        require('electron').app.exit(0);
        break;

      default:
        console.log('Forwarding command to renderer:', message.command);
        mainWindow.webContents.send(message.command, message.data);
        break;
    }
  }
}

module.exports = CommandHandler;