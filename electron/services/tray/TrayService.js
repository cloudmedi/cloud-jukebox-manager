const { Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

class TrayService {
  constructor(mainWindow) {
    this.tray = null;
    this.mainWindow = mainWindow;
    this.isPlaying = false;
    this.currentSong = null;
    this.isAnnouncementPlaying = false;
    this.announcementRemainingTime = 0;
    this.updateInterval = null;
  }

  createTray() {
    try {
      const iconPath = path.join(__dirname, '../../icon.png');
      console.log('Tray icon path:', iconPath);
      
      this.tray = new Tray(iconPath);
      this.updateTrayMenu();
      
      this.tray.setToolTip('Cloud Media Player');
      
      this.setupTrayEvents();
      
      console.log('Tray created successfully');
    } catch (error) {
      console.error('Error creating tray:', error);
    }
  }

  setupTrayEvents() {
    this.tray.on('double-click', () => {
      this.mainWindow.show();
      this.mainWindow.focus();
    });
    
    this.tray.on('click', () => {
      this.mainWindow.show();
      this.mainWindow.focus();
    });

    this.tray.on('right-click', (event, bounds) => {
      const { x, y } = bounds;
      const contextMenu = this.tray.getContextMenu();
      contextMenu.popup({ x: x - 100, y: y });
    });
  }

  updateTrayMenu(song = this.currentSong) {
    if (!this.tray) return;

    const deviceInfo = store.get('deviceInfo');
    let menuTemplate = [];

    if (this.isAnnouncementPlaying) {
      // Anons çalarken özel menü
      menuTemplate = [
        {
          label: 'Cloud Media Player',
          click: () => {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        },
        { type: 'separator' },
        {
          label: '⚠️ Anons Çalıyor',
          enabled: false,
          id: 'announcement-label'
        },
        {
          label: `Kalan Süre: ${this.formatTime(this.announcementRemainingTime)}`,
          enabled: false,
          id: 'announcement-time'
        },
        { type: 'separator' },
        {
          label: 'Şarkı Kontrolü (Anons Sırasında Devre Dışı)',
          enabled: false
        },
        {
          label: this.isPlaying ? 'Duraklat' : 'Çal',
          enabled: false
        },
        {
          label: 'Sonraki Şarkı',
          enabled: false
        }
      ];
    } else {
      // Normal menü
      menuTemplate = [
        {
          label: 'Cloud Media Player',
          click: () => {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        },
        { type: 'separator' },
        {
          label: 'Şu an çalıyor:',
          enabled: false,
          id: 'now-playing-label'
        },
        {
          label: song?.name || 'Şarkı çalmıyor',
          enabled: false,
          id: 'song-name'
        },
        {
          label: song?.artist || '',
          enabled: false,
          id: 'artist-name'
        },
        { type: 'separator' },
        {
          label: this.isPlaying ? 'Duraklat' : 'Çal',
          click: () => {
            this.mainWindow.webContents.send('toggle-playback');
          }
        },
        {
          label: 'Sonraki Şarkı',
          click: () => {
            this.mainWindow.webContents.send('next-song');
          }
        }
      ];
    }

    // Ortak menü öğeleri
    menuTemplate.push(
      { type: 'separator' },
      {
        label: `Token: ${deviceInfo?.token || 'Yok'}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Çıkış',
        click: () => {
          this.mainWindow.isQuitting = true;
          this.mainWindow.quit();
        }
      }
    );

    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    this.tray.setContextMenu(contextMenu);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  setAnnouncementState(isPlaying, remainingTime = 0) {
    console.log('Setting announcement state:', { isPlaying, remainingTime });
    this.isAnnouncementPlaying = isPlaying;
    this.announcementRemainingTime = remainingTime;
    
    // Eğer interval varsa temizle
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Anons çalıyorsa yeni interval başlat
    if (isPlaying && remainingTime > 0) {
      this.updateInterval = setInterval(() => {
        this.announcementRemainingTime = Math.max(0, this.announcementRemainingTime - 1);
        this.updateTrayMenu();
        
        // Süre bittiyse interval'i temizle
        if (this.announcementRemainingTime <= 0 && this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
      }, 1000);
    }
    
    this.updateTrayMenu();
  }

  updatePlaybackState(isPlaying) {
    this.isPlaying = isPlaying;
    this.updateTrayMenu();
  }

  updateCurrentSong(song) {
    this.currentSong = song;
    this.updateTrayMenu(song);
  }
}

module.exports = TrayService;