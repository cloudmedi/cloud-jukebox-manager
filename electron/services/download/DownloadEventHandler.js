const { ipcRenderer } = require('electron');
const { toast } = require('../ui/UIManager');

class DownloadEventHandler {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    ipcRenderer.on('download-progress', (event, { songName, progress }) => {
      console.log(`Download progress for ${songName}: ${progress}%`);
      // UI güncelleme
      this.updateDownloadProgress(songName, progress);
    });

    ipcRenderer.on('download-complete', (event, { songName }) => {
      console.log(`Download completed: ${songName}`);
      toast({
        title: "İndirme Tamamlandı",
        description: `${songName} başarıyla indirildi`
      });
    });

    ipcRenderer.on('download-error', (event, { songName, error }) => {
      console.error(`Download error for ${songName}:`, error);
      toast({
        variant: "destructive",
        title: "İndirme Hatası",
        description: `${songName} indirilemedi: ${error}`
      });
    });
  }

  updateDownloadProgress(songName, progress) {
    // Progress bar güncelleme
    const progressBar = document.getElementById('downloadProgress');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute('aria-valuenow', progress);
    }

    // İndirme durumu metni güncelleme
    const statusText = document.getElementById('downloadStatus');
    if (statusText) {
      statusText.textContent = `${songName} indiriliyor: %${progress}`;
    }
  }
}

module.exports = new DownloadEventHandler();