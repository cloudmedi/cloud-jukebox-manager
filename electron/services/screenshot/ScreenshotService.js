const { desktopCapturer } = require('electron');

class ScreenshotService {
  async captureMainWindow() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 400, height: 400 }
      });

      const mainWindow = sources.find(source => 
        source.name === 'Cloud Media Player'
      );

      if (!mainWindow) {
        throw new Error('Main window not found');
      }

      // En yüksek kalitede thumbnail al
      const thumbnail = mainWindow.thumbnail.toDataURL();
      return thumbnail;
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
}

module.exports = new ScreenshotService();