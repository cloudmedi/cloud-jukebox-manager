const { desktopCapturer } = require('electron');

class ScreenshotHandler {
  static async takeScreenshot() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      const mainSource = sources.find(source => source.name === 'Entire screen');
      if (!mainSource) {
        throw new Error('No screen source found');
      }

      const thumbnail = mainSource.thumbnail.toDataURL();
      const base64Data = thumbnail.split(',')[1];
      
      return base64Data;
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
}

module.exports = ScreenshotHandler;