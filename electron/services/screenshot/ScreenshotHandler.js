const { desktopCapturer } = require('electron');

class ScreenshotHandler {
  async takeScreenshot() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      const mainWindow = sources.find(source => 
        source.name === 'Cloud Media Player' || 
        source.name.includes('Cloud Media')
      );

      if (!mainWindow) {
        throw new Error('Main window not found');
      }

      const thumbnail = mainWindow.thumbnail.toDataURL();
      const base64Data = thumbnail.split(',')[1];
      
      return base64Data;
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
}

module.exports = new ScreenshotHandler();