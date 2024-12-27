const { app } = require('electron');
const path = require('path');
const fs = require('fs');

async function cleanupCache() {
  return new Promise((resolve, reject) => {
    const cachePath = path.join(app.getPath('userData'), 'cache');
    
    // Cache klasörü yoksa işlem başarılı sayılır
    if (!fs.existsSync(cachePath)) {
      resolve();
      return;
    }

    // Cache temizliğini bir sonraki event loop'a ertele
    setTimeout(() => {
      try {
        // Önce cache içindeki dosyaları temizlemeyi dene
        const files = fs.readdirSync(cachePath);
        for (const file of files) {
          const filePath = path.join(cachePath, file);
          try {
            if (fs.lstatSync(filePath).isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            console.warn(`Failed to delete ${filePath}: ${error.message}`);
          }
        }

        // Ana cache klasörünü silmeyi dene
        fs.rmSync(cachePath, { recursive: true, force: true });
        resolve();
      } catch (error) {
        // Hata durumunda bile işlemi başarılı say
        console.warn('Cache cleanup warning:', error);
        resolve();
      }
    }, 100);
  });
}

module.exports = {
  cleanupCache
};