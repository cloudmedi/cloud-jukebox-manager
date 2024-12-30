const { BrowserWindow } = require('electron');

class ScreenshotHandler {
  async takeScreenshot() {
    try {
      console.log('Taking screenshot...');
      
      // Global mainWindow referansını al
      const mainWindow = global.mainWindow;
      
      if (!mainWindow || !(mainWindow instanceof BrowserWindow)) {
        console.error('Main window not found or invalid');
        throw new Error('Main window not found');
      }

      // webContents.capturePage() kullanarak doğrudan pencere görüntüsünü al
      const image = await mainWindow.webContents.capturePage();
      const screenshot = image.toDataURL();
      
      console.log('Screenshot captured successfully');
      
      return {
        success: true,
        data: screenshot
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