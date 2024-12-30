const Store = require('electron-store');
const store = new Store();

class VolumeManager {
  constructor() {
    // Varsayılan volume değeri
    this.defaultVolume = 70;
  }

  // Store'dan volume değerini al
  getStoredVolume() {
    return store.get('volume', this.defaultVolume);
  }

  // Volume değerini store'a kaydet
  saveVolume(volume) {
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    store.set('volume', normalizedVolume);
    console.log('Volume saved to store:', normalizedVolume);
    return normalizedVolume;
  }

  // Volume değerini 0-1 arasına normalize et
  normalizeVolume(volume) {
    return volume / 100;
  }
}

module.exports = new VolumeManager();