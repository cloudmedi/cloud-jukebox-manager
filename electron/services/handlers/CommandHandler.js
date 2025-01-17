const { BrowserWindow } = require('electron');
const screenshotHandler = require('../screenshot/ScreenshotHandler');

class CommandHandler {
  static async handleCommand(message) {
    console.log('Processing command:', message);
    const mainWindow = global.mainWindow;
    
    if (!mainWindow) {
      console.log('No main window found');
      return;
    }

    try {
      switch (message.command) {
        case 'play':
          console.log('Play command received');
          const audioPlayer = mainWindow.webContents;
          audioPlayer.send('playback-command', { action: 'play' });
          break;

        case 'pause':
          console.log('Pause command received');
          const player = mainWindow.webContents;
          player.send('playback-command', { action: 'pause' });
          break;

        case 'screenshot':
          console.log('Taking screenshot...');
          const result = await screenshotHandler.takeScreenshot();
          console.log('Screenshot result:', result);
          
          if (result.success) {
            const websocketService = require('../websocketService');
            websocketService.sendMessage({
              type: 'screenshot',
              token: message.token,
              data: result.data.split(',')[1]
            });
          }
          
          mainWindow.webContents.send('screenshot-taken', {
            success: result.success,
            error: result.error
          });
          break;

        default:
          console.log('Unknown command:', message.command);
          mainWindow.webContents.send(message.command, message.data);
          break;
      }
    } catch (error) {
      console.error('Command handling error:', error);
      mainWindow.webContents.send('screenshot-taken', {
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = CommandHandler;