const { contextBridge, desktopCapturer, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  captureScreenshot: async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 1920, height: 1080 }
      });
      
      const mainWindow = sources.find(source => source.name === 'Cloud Media Player');
      if (!mainWindow) {
        throw new Error('Ana pencere bulunamadı');
      }

      return mainWindow.thumbnail.toDataURL();
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
});
