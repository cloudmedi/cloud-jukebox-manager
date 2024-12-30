const { desktopCapturer } = require('electron');

class ScreenshotHandler {
  async takeScreenshot() {
    try {
      console.log('Taking screenshot...');
      console.log('Getting window sources...');
      
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      console.log('Available sources:', sources.map(s => s.name));

      const mainWindow = sources.find(source => 
        source.name.toLowerCase().includes('cloud') || 
        source.name.toLowerCase().includes('media') ||
        source.name.toLowerCase().includes('player')
      );

      if (!mainWindow) {
        console.error('Available windows:', sources.map(s => s.name));
        throw new Error('Main window not found');
      }

      console.log('Found window:', mainWindow.name);
      const thumbnail = mainWindow.thumbnail.toDataURL();
      const base64Data = thumbnail.split(',')[1]; // Remove data URL prefix
      console.log('Screenshot taken successfully');
      
      return base64Data;
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
}

module.exports = new ScreenshotHandler();