const { BrowserWindow } = require('electron');
const screenshotHandler = require('../screenshot/ScreenshotHandler');

class CommandHandler {
  static async handleCommand(message) {
    console.log('Processing command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (!mainWindow) {
      console.log('No main window found');
      return;
    }

    try {
      switch (message.command) {
        case 'screenshot':
          console.log('Taking screenshot...');
          const screenshotData = await screenshotHandler.takeScreenshot();
          console.log('Screenshot taken successfully');
          
          // WebSocket üzerinden admin paneline gönder
          const websocketService = require('../websocketService');
          websocketService.sendMessage({
            type: 'screenshot',
            data: screenshotData.data
          });
          
          mainWindow.webContents.send('screenshot-taken', {
            success: true,
            data: screenshotData
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