const { desktopCapturer } = require('electron');

class ScreenshotHandler {
  async takeScreenshot() {
    try {
      console.log('Getting window sources...');
      
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 1920, height: 1080 },
        fetchWindowIcons: true
      });

      console.log('Available sources:', sources.map(s => s.name));

      // Önce tam eşleşme deneyelim
      let mainWindow = sources.find(source => 
        source.name === 'Cloud Media Player'
      );

      // Tam eşleşme bulunamazsa, içeren bir pencere arayalım
      if (!mainWindow) {
        mainWindow = sources.find(source => 
          source.name.includes('Cloud Media Player')
        );
      }

      // Hala bulunamadıysa, tüm pencerelerin ilkini alalım
      if (!mainWindow && sources.length > 0) {
        console.log('Using first available window as fallback');
        mainWindow = sources[0];
      }

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