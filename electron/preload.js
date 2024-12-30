const { contextBridge, desktopCapturer, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  captureScreenshot: async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });
      
      const mainWindow = sources.find(source => 
        source.name === 'Cloud Media Player' || 
        source.name === 'Entire Screen' || 
        source.name.toLowerCase().includes('screen')
      );
      
      if (!mainWindow) {
        throw new Error('Ekran görüntüsü alınamadı');
      }

      return mainWindow.thumbnail.toDataURL();
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }
});

// IPC olaylarını dinle
ipcRenderer.on('take-screenshot', async () => {
  try {
    const screenshotData = await window.electron.captureScreenshot();
    // WebSocket üzerinden screenshot verisini gönder
    window.ws.send(JSON.stringify({
      type: 'screenshot',
      data: screenshotData
    }));
  } catch (error) {
    console.error('Screenshot capture error:', error);
  }
});