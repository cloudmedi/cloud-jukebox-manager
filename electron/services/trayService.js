const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class TrayService {
  constructor() {
    this.tray = null;
    this.currentSong = null;
  }

  createTray(mainWindow) {
    const iconPath = path.join(__dirname, '../icon.png');
    this.tray = new Tray(iconPath);
    
    this.updateContextMenu(mainWindow);
    this.setupTrayEvents(mainWindow);
  }

  updateSongInfo(song) {
    this.currentSong = song;
    this.tray.setToolTip(`Now Playing: ${song.name} - ${song.artist}`);
    this.updateContextMenu();
  }

  updateContextMenu(mainWindow) {
    const contextMenu = Menu.buildFromTemplate([
      this.currentSong && {
        label: `Now Playing: ${this.currentSong.name}`,
        enabled: false,
      },
      this.currentSong && {
        label: this.currentSong.artist,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: 'Show App',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        }
      },
      {
        label: 'Exit',
        click: () => {
          mainWindow.destroy();
        }
      }
    ].filter(Boolean));

    this.tray.setContextMenu(contextMenu);
  }

  setupTrayEvents(mainWindow) {
    this.tray.on('double-click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
  }
}

module.exports = new TrayService();