const { BrowserWindow } = require('electron');
const screenshotHandler = require('../screenshot/ScreenshotHandler');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');

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
      mainWindow.webContents.send('command-error', {
        command: message.command,
        error: error.message
      });
    }
  }
}

module.exports = CommandHandler;