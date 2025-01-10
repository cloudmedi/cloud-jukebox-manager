const Store = require('electron-store');
const store = new Store();

class VolumeManager {
  constructor() {
    // Varsayılan volume değeri
    this.defaultVolume = 70;
    
    // Store'dan kayıtlı volume değerini al
    this.currentVolume = this.getStoredVolume();
  }

  // Store'dan volume değerini al
  getStoredVolume() {
    return store.get('volume', this.defaultVolume);
  }

  // Volume değerini store'a kaydet
  saveVolume(volume) {
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    store.set('volume', normalizedVolume);
    this.currentVolume = normalizedVolume;
    console.log('Volume saved to store:', normalizedVolume);
    return normalizedVolume;
  }

  // 0-100 arası değeri 0-1 arası değere dönüştür
  normalizeVolume(volume) {
    return volume / 100;
  }

  // Mevcut volume değerini al
  getCurrentVolume() {
    return this.currentVolume;
  }
}

// Singleton instance oluştur
const volumeManager = new VolumeManager();
module.exports = volumeManager;