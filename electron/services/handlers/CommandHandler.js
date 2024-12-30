const screenshotHandler = require('../screenshot/ScreenshotHandler');
const { ipcRenderer } = require('electron');

class CommandHandler {
  async handleCommand(message) {
    console.log('Processing command:', message);

    try {
      switch (message.command) {
        case 'screenshot':
          console.log('Taking screenshot...');
          const screenshotData = await screenshotHandler.takeScreenshot();
          
          // WebSocket üzerinden ekran görüntüsünü gönder
          ipcRenderer.send('screenshot-taken', {
            success: true,
            data: screenshotData,
            token: message.token
          });
          break;

        default:
          console.log('Unknown command:', message.command);
          break;
      }
    } catch (error) {
      console.error('Command handling error:', error);
      ipcRenderer.send('screenshot-taken', {
        success: false,
        error: error.message,
        token: message.token
      });
    }
  }
}

module.exports = new CommandHandler();