const { desktopCapturer } = require('electron');

class ScreenshotHandler {
  async takeScreenshot() {
    try {
      console.log('Getting window sources...');
      
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      console.log('Available sources:', sources.map(s => s.name));

      // Electron uygulamasını bul
      const mainWindow = sources.find(source => 
        source.name.includes('Cloud Media Player') || 
        source.name === 'Cloud Media Player'
      );

      if (!mainWindow) {
        console.error('Main window not found in sources');
        throw new Error('Main window not found');
      }

      console.log('Found window:', mainWindow.name);
      const thumbnail = mainWindow.thumbnail.toDataURL();
      console.log('Screenshot captured successfully');
      
      return {
        success: true,
        data: thumbnail
      };
    } catch (error) {
      console.error('Screenshot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ScreenshotHandler();