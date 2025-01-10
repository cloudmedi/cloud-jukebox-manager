const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./services/websocketService');
const deviceService = require('./services/deviceService');
const SchedulePlayer = require('./services/schedule/SchedulePlayer');
const scheduleStorage = require('./services/schedule/ScheduleStorage');
require('./services/audioService');

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

// Schedule event'lerini dinle ve renderer'a ilet
schedulePlayer.on('schedule-started', (data) => {
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('schedule-started', data);
  });
});

schedulePlayer.on('schedule-stopped', (scheduleId) => {
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('schedule-stopped', scheduleId);
  });
});

// Schedule error event'ini dinle
schedulePlayer.on('schedule-error', (error) => {
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('schedule-error', error);
  });
});

// Uygulama hazır olduğunda aktif schedule'ı kontrol et
app.whenReady().then(async () => {
  try {
    // Uygulama başladığında device token'ı kaydet
    await deviceService.registerDeviceToken();
    
    // Önce window'u oluştur
    createWindow();
    createTray();

    // Window yüklenmesini bekle
    await new Promise(resolve => {
      mainWindow.webContents.on('did-finish-load', resolve);
    });

    console.log('Checking for active schedules...');
    
    // Sonra aktif schedule kontrolü yap
    const activeSchedules = await scheduleStorage.getActiveSchedules();
    console.log('Active schedules:', activeSchedules);
    
    const now = new Date();
    console.log('Current time:', now);

    // Aktif schedule'ı bul
    const currentSchedule = activeSchedules.find(schedule => {
      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);
      const isActive = startDate <= now && endDate >= now;
      
      console.log('Schedule check:', {
        id: schedule.id,
        startDate,
        endDate,
        isActive,
        playlist: schedule.playlist ? {
          id: schedule.playlist.id,
          name: schedule.playlist.name,
          songCount: schedule.playlist.songs?.length
        } : null
      });
      
      return isActive;
    });

    // Aktif schedule varsa başlat
    if (currentSchedule) {
      console.log('Found active schedule:', currentSchedule);
      
      try {
        // Schedule'ı başlat
        console.log('Starting schedule:', currentSchedule.id);
        const success = await schedulePlayer.startSchedule(currentSchedule.id);
        
        if (success) {
          console.log('Schedule started successfully:', currentSchedule.id);
        } else {
          console.error('Failed to start schedule:', currentSchedule.id);
          // Schedule başlatılamazsa son playlist'i dene
          console.log('Falling back to last playlist');
          loadLastPlaylist();
        }
      } catch (error) {
        console.error('Error auto-starting schedule:', error);
        // Hata durumunda son playlist'i dene
        console.log('Error occurred, falling back to last playlist');
        loadLastPlaylist();
      }
    } else {
      console.log('No active schedule found');
      // Schedule yoksa son playlist'i başlat
      loadLastPlaylist();
    }
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});

function loadLastPlaylist() {
  try {
    const deviceInfo = store.get('deviceInfo');
    if (deviceInfo && deviceInfo.token) {
      const playlists = store.get('playlists', []);
      if (playlists.length > 0) {
        const lastPlaylist = playlists[playlists.length - 1];
        console.log('Starting last saved playlist:', lastPlaylist.name);
        mainWindow.webContents.send('auto-play-playlist', lastPlaylist);
      }
    }
  } catch (error) {
    console.error('Error loading last playlist:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    minWidth: 1000,
    minHeight: 1000,
    maxWidth: 1000,
    maxHeight: 1000,
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

  // Pencereyi global olarak sakla
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

  const deviceInfo = store.get('deviceInfo');
  if (deviceInfo && deviceInfo.token) {
    websocketService.connect(deviceInfo.token);
    
    const playlists = store.get('playlists', []);
    if (playlists.length > 0) {
      const lastPlaylist = playlists[playlists.length - 1];
      console.log('Starting last saved playlist:', lastPlaylist.name);
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('auto-play-playlist', lastPlaylist);
      });
    }
  }
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

app.on('window-all-closed', () => {
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
