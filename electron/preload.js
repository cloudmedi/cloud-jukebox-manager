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
  },

  // WebSocket üzerinden screenshot yanıtını gönder
  sendScreenshotResponse: (imageData) => {
    ipcRenderer.send('screenshot-response', imageData);
  }
});

// Screenshot komutunu dinle
ipcRenderer.on('take-screenshot', async () => {
  try {
    const screenshot = await window.electron.captureScreenshot();
    window.electron.sendScreenshotResponse(screenshot);
  } catch (error) {
    console.error('Screenshot capture error:', error);
  }
});