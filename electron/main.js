const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
const deviceService = require('./services/deviceService');
const SchedulePlayer = require('./services/schedule/SchedulePlayer');
const scheduleStorage = require('./services/schedule/ScheduleStorage');
require('./services/audioService');

// WebSocket mesaj handler'ı
ipcMain.handle('send-websocket-message', async (event, message) => {
  try {
    // Debug modunda değilse loglama yapma
    if (process.env.NODE_ENV === 'development') {
      console.log('Handling WebSocket message:', message);
    }
    websocketService.handleMessage(message);
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
});

// Şarkı değişim eventi
ipcMain.on('song-changed', (event, song) => {
  console.log('Main process received song-changed event:', song);
  
  // Tray menüsünü güncelle
  currentSong = song;
  updateTrayMenu(song);

  // Renderer process'e bildir
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-current-song', song);
  }
});

// Set application name
app.name = 'Cloud Media Player';
app.setAppUserModelId('Cloud Media Player');

let mainWindow;
let tray = null;
let isPlaying = false;
let currentSong = null;

// Schedule player'ı başlat
const schedulePlayer = new SchedulePlayer(path.join(app.getPath('userData'), 'schedules'));

// Schedule kontrolü için IPC handler
ipcMain.handle('check-active-schedule', async () => {
  try {
    const activeSchedules = await scheduleStorage.getActiveSchedules();
    const now = new Date();

    // Aktif schedule'ı bul
    const hasActiveSchedule = activeSchedules.some(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      return startDate <= now && endDate >= now;
    });

    return hasActiveSchedule;
  } catch (error) {
    console.error('Error checking active schedules:', error);
    return false;
  }
});

// Aktif schedule'ı getiren IPC handler
ipcMain.handle('get-active-schedule', async () => {
  try {
    const activeSchedules = await scheduleStorage.getActiveSchedules();
    const now = new Date();

    // Aktif schedule'ı bul
    const currentSchedule = activeSchedules.find(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      return startDate <= now && endDate >= now;
    });

    if (currentSchedule) {
      // Playlist detaylarını al
      const playlist = await scheduleStorage.getSchedulePlaylist(currentSchedule.id);
      
      // Schedule başladı event'ini gönder
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('schedule-started', {
          ...currentSchedule,
          playlist
        });
      }

      return {
        schedule: {
          ...currentSchedule,
          playlist
        }
      };
    }

    // Schedule bitti event'ini gönder
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('schedule-stopped');
    }

    return { schedule: null };
  } catch (error) {
    console.error('Error getting active schedule:', error);
    return { schedule: null, error: error.message };
  }
});

// Schedule kontrolü için IPC handler
ipcMain.handle('schedule-control', async (event, { manuallyPaused }) => {
  try {
    return await scheduleStorage.setManuallyPaused(manuallyPaused);
  } catch (error) {
    console.error('Schedule control error:', error);
    return false;
  }
});

// Schedule pause state handler
ipcMain.handle('get-schedule-pause-state', async () => {
  try {
    const scheduleStorage = require('./services/schedule/ScheduleStorage');
    return scheduleStorage.isManuallyPaused();
  } catch (error) {
    console.error('Error getting schedule pause state:', error);
    return false;
  }
});

// Schedule event handlers
let scheduleErrorHandler = null;
let scheduleStartHandler = null;
let scheduleStopHandler = null;

function setupScheduleEvents() {
  // Önceki event handler'ları temizle
  if (scheduleErrorHandler) {
    schedulePlayer.removeListener('schedule-error', scheduleErrorHandler);
  }
  if (scheduleStartHandler) {
    schedulePlayer.removeListener('schedule-started', scheduleStartHandler);
  }
  if (scheduleStopHandler) {
    schedulePlayer.removeListener('schedule-stopped', scheduleStopHandler);
  }

  // Yeni event handler'ları tanımla
  scheduleErrorHandler = (error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('schedule-error', error);
    }
  };

  scheduleStartHandler = (scheduleData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('schedule-started', scheduleData);
    }
  };

  scheduleStopHandler = (scheduleId) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('schedule-stopped', scheduleId);
    }
  };

  // Event listener'ları ekle
  schedulePlayer.on('schedule-error', scheduleErrorHandler);
  schedulePlayer.on('schedule-started', scheduleStartHandler);
  schedulePlayer.on('schedule-stopped', scheduleStopHandler);
}

app.whenReady().then(async () => {
  try {
    // Uygulama başladığında device token'ı kaydet
    await deviceService.registerDeviceToken();
    
    // Önce window'u oluştur
    createWindow();
    createTray();

    // WebSocket bağlantısını başlat
    websocketService.connect();

    // Window yüklenmesini bekle
    await new Promise(resolve => {
      mainWindow.webContents.on('did-finish-load', resolve);
    });

    console.log('Checking for active schedules...');
    
    // Schedule event'lerini ayarla
    setupScheduleEvents();
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    minWidth: 800,
    minHeight: 800,
    maxWidth: 800,
    maxHeight: 800,
    resizable: false,
    backgroundColor: '#1a1b1e',
    frame: false,
    title: 'Cloud Media Player',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true
    }
  });

  global.mainWindow = mainWindow;
  mainWindow.loadFile('index.html');
  
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', function (event) {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray === null) {
        createTray();
      }
    }
    return false;
  });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    console.log('Tray icon path:', iconPath);
    
    tray = new Tray(iconPath);
    
    updateTrayMenu();
    
    tray.setToolTip('Cloud Media Player');
    
    tray.on('double-click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    
    tray.on('click', () => {
      mainWindow.show();
      mainWindow.focus();
    });

    tray.on('right-click', (event, bounds) => {
      const { x, y } = bounds;
      const contextMenu = tray.getContextMenu();
      contextMenu.popup({ x: x - 100, y: y });
    });
    
    console.log('Tray created successfully');
  } catch (error) {
    console.error('Error creating tray:', error);
  }
}

app.on('before-quit', () => {
  try {
    console.log('Application is quitting, starting cleanup...');
    
    // Global JukeboxPlayer cleanup
    if (global.jukeboxPlayer) {
      global.jukeboxPlayer.cleanup();
    }
    
    app.isQuitting = true;
  } catch (error) {
    console.error('Error during application cleanup:', error);
  }
});

app.on('window-all-closed', () => {
  if (scheduleErrorHandler) {
    schedulePlayer.removeListener('schedule-error', scheduleErrorHandler);
  }
  if (scheduleStartHandler) {
    schedulePlayer.removeListener('schedule-started', scheduleStartHandler);
  }
  if (scheduleStopHandler) {
    schedulePlayer.removeListener('schedule-stopped', scheduleStopHandler);
  }
  
  scheduleErrorHandler = null;
  scheduleStartHandler = null;
  scheduleStopHandler = null;
  
  // Global cleanup
  if (global.jukeboxPlayer) {
    global.jukeboxPlayer.cleanup();
  }
  
  schedulePlayer.cleanup();
  websocketService.disconnect();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

ipcMain.handle('save-device-info', async (event, deviceInfo) => {
  store.set('deviceInfo', deviceInfo);
  
  if (deviceInfo.token) {
    websocketService.connect(deviceInfo.token);
  }
  
  return deviceInfo;
});

ipcMain.handle('get-device-info', async () => {
  return store.get('deviceInfo');
});

// Playback durumu gönderme handler'ı
ipcMain.handle('send-playback-status', async (event, message) => {
  try {
    console.log('Sending playback status:', message);
    await websocketService.sendMessage(message);
  } catch (error) {
    console.error('Error sending playback status:', error);
  }
});

// Şarkı değiştiğinde tray menüsünü güncelle
ipcMain.on('song-changed', (event, song) => {
  console.log('Updating tray menu with song:', song);
  currentSong = song;
  updateTrayMenu(song);
});

// Update playback state when it changes
ipcMain.on('playback-status-changed', (event, playing) => {
  console.log('Playback status changed:', playing);
  isPlaying = playing;
  updateTrayMenu(currentSong);
});

// Playlist handlers
ipcMain.handle('get-current-playlist', async () => {
  try {
    // Burada backend'den playlist'i alabilirsiniz
    // Şimdilik mock data dönüyoruz
    return {
      success: true,
      playlist: {
        id: 'default',
        name: 'Default Playlist',
        songs: [
          // Mock şarkılar
          {
            id: '1',
            name: 'Test Song 1',
            artist: 'Test Artist 1',
            localPath: 'path/to/song1.mp3'
          },
          {
            id: '2',
            name: 'Test Song 2',
            artist: 'Test Artist 2',
            localPath: 'path/to/song2.mp3'
          }
        ]
      }
    };
  } catch (error) {
    console.error('Error getting current playlist:', error);
    return { success: false, error: error.message };
  }
});

// Artwork kaydetme handler'ı
ipcMain.handle('save-artwork', async (event, { path: artworkPath, buffer }) => {
  try {
    const fs = require('fs');
    const { promisify } = require('util');
    const writeFile = promisify(fs.writeFile);
    const mkdir = promisify(fs.mkdir);

    // Artwork klasörünü oluştur
    const artworkDir = require('path').dirname(artworkPath);
    await mkdir(artworkDir, { recursive: true });

    // Buffer'ı dosyaya kaydet
    await writeFile(artworkPath, Buffer.from(buffer));
    
    console.log('Artwork saved:', artworkPath);
    return artworkPath;
  } catch (error) {
    console.error('Error saving artwork:', error);
    throw error;
  }
});

function updateTrayMenu(song = currentSong) {
  if (!tray) return;

  const deviceInfo = store.get('deviceInfo');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Cloud Media Player',
      click: function() {
        mainWindow.show();
        mainWindow.focus();
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
      label: isPlaying ? 'Duraklat' : 'Çal',
      click: function() {
        console.log('Tray menu playback toggle clicked, current state:', isPlaying);
        mainWindow.webContents.send('toggle-playback');
      }
    },
    {
      label: 'Sonraki Şarkı',
      click: function() {
        mainWindow.webContents.send('next-song');
      }
    },
    { type: 'separator' },
    {
      label: `Token: ${deviceInfo?.token || 'Yok'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: function() {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}