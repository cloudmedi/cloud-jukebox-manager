const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');
const store = new Store();
const os = require('os');

async function cleanupLocalFiles() {
  try {
    // Uygulama veri dizinini al
    const appDataPath = app.getPath('userData');
    
    // Playlist ve şarkı dosyalarını temizle
    const downloadPath = path.join(appDataPath, 'downloads');
    await fs.rm(downloadPath, { recursive: true, force: true });
    
    // Store'u temizle
    store.clear();
    
    console.log('Local files cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up local files:', error);
  }
}

function getDeviceInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus()[0].model,
    totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
    freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
    networkInterfaces: Object.values(os.networkInterfaces())
      .flat()
      .filter(ni => !ni.internal && ni.family === 'IPv4')
      .map(ni => ni.address),
    osVersion: os.release()
  };
}

module.exports = {
  cleanupLocalFiles,
  getDeviceInfo
};