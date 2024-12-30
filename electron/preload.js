const { contextBridge, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Ekran görüntüsü alma fonksiyonu
  captureScreen: async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      const mainSource = sources[0]; // İlk ekranı al
      return mainSource.thumbnail.toDataURL();
    } catch (error) {
      console.error('Screen capture error:', error);
      throw error;
    }
  }
});