const fs = require('fs/promises');
const path = require('path');
const { app } = require('electron');

const APP_DATA_PATH = path.join(app.getPath('userData'), 'app_data');

const DIRECTORIES = {
  playlists: path.join(APP_DATA_PATH, 'playlists'),
  announcements: path.join(APP_DATA_PATH, 'announcements'),
  cache: path.join(APP_DATA_PATH, 'cache'),
  db: path.join(APP_DATA_PATH, 'db'),
  logs: path.join(APP_DATA_PATH, 'logs')
};

async function initializeFileSystem() {
  try {
    // Ana dizinleri oluştur
    await Promise.all(
      Object.values(DIRECTORIES).map(dir => 
        fs.mkdir(dir, { recursive: true })
      )
    );

    console.log('File system initialized:', APP_DATA_PATH);
    return true;
  } catch (error) {
    console.error('File system initialization error:', error);
    throw error;
  }
}

async function checkDiskSpace() {
  try {
    const stats = await fs.statfs(APP_DATA_PATH);
    const totalSpace = stats.blocks * stats.bsize;
    const freeSpace = stats.bfree * stats.bsize;
    const usedSpace = totalSpace - freeSpace;
    
    return {
      total: totalSpace,
      free: freeSpace,
      used: usedSpace,
      usagePercentage: (usedSpace / totalSpace) * 100
    };
  } catch (error) {
    console.error('Disk space check error:', error);
    throw error;
  }
}

module.exports = {
  initializeFileSystem,
  checkDiskSpace,
  DIRECTORIES
};