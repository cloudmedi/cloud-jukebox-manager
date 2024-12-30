const { BrowserWindow } = require('electron');

class CommandHandler {
  static handleCommand(message) {
    console.log('Processing command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (!mainWindow) {
      console.log('No main window found');
      return;
    }

    switch (message.command) {
      case 'screenshot':
        console.log('Taking screenshot...');
        mainWindow.webContents.send('take-screenshot');
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
        console.log('Unknown command:', message.command);
        mainWindow.webContents.send(message.command, message.data);
        break;
    }
  }
}

module.exports = CommandHandler;