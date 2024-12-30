const { desktopCapturer } = require('electron');

class ScreenshotService {
  async captureMainWindow() {
    try {
      console.log('Getting window sources...');
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 800, height: 600 }
      });

      // Tüm pencereleri logla
      console.log('Available windows:', sources.map(s => s.name));

      // İlk pencereyi al (aktif pencere)
      const mainWindow = sources[0];

      if (!mainWindow) {
        throw new Error('No windows found');
      }

      console.log('Taking screenshot of window:', mainWindow.name);
      const thumbnail = mainWindow.thumbnail.toDataURL();
      
      return thumbnail;
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
}

module.exports = new ScreenshotService();