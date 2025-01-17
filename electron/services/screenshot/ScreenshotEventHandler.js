const { ipcRenderer } = require('electron');

class ScreenshotEventHandler {
  constructor(ws) {
    this.ws = ws;
    this.initialize();
  }

  initialize() {
    ipcRenderer.on('screenshot-taken', (event, result) => {
      console.log('Screenshot event received:', result);
      
      if (result.success && result.data) {
        console.log('Sending screenshot via WebSocket');
        this.ws.send(JSON.stringify({
          type: 'screenshot',
          data: result.data
        }));
      } else {
        console.error('Screenshot error:', result.error);
        this.ws.send(JSON.stringify({
          type: 'error',
          error: 'Screenshot failed: ' + (result.error || 'Unknown error')
        }));
      }
    });
  }
}

module.exports = ScreenshotEventHandler;