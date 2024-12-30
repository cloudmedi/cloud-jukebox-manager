const { ipcRenderer } = require('electron');

class ScreenshotHandler {
  static initialize() {
    ipcRenderer.on('screenshot-taken', (event, result) => {
      if (result.success) {
        console.log('Screenshot taken successfully');
        ipcRenderer.send('websocket-message', {
          type: 'commandStatus',
          command: 'screenshot',
          success: true,
          data: result.data
        });
      } else {
        console.error('Screenshot error:', result.error);
        ipcRenderer.send('websocket-message', {
          type: 'commandStatus',
          command: 'screenshot',
          success: false,
          error: result.error
        });
      }
    });
  }
}

module.exports = ScreenshotHandler;