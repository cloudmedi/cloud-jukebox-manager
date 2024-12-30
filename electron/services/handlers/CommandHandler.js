const { BrowserWindow } = require('electron');
const ScreenshotHandler = require('../screenshot/ScreenshotHandler');

class CommandHandler {
  static async handleCommand(message) {
    console.log('Processing command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (!mainWindow) {
      console.log('No main window found');
      return;
    }

    switch (message.command) {
      case 'screenshot':
        try {
          console.log('Taking screenshot...');
          const screenshotData = await ScreenshotHandler.takeScreenshot();
          mainWindow.webContents.send('screenshot-taken', {
            success: true,
            data: screenshotData,
            token: message.token
          });
        } catch (error) {
          console.error('Screenshot error:', error);
          mainWindow.webContents.send('screenshot-taken', {
            success: false,
            error: error.message,
            token: message.token
          });
        }
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