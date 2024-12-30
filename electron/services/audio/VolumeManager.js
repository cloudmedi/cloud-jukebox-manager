const Store = require('electron-store');
const store = new Store();

class VolumeManager {
  constructor() {
    this.defaultVolume = 70;
    this.audioElements = new Set();
  }

  // Ses seviyesini store'dan al
  getStoredVolume() {
    return store.get('volume', this.defaultVolume);
  }

  // Audio elementi kaydet
  registerAudioElement(audioElement) {
    this.audioElements.add(audioElement);
    // Mevcut volume değerini uygula
    const volume = this.getStoredVolume();
    audioElement.volume = volume / 100;
  }

  // Audio elementi kaldır
  unregisterAudioElement(audioElement) {
    this.audioElements.delete(audioElement);
  }

  // Tüm audio elementlerin ses seviyesini güncelle
  setVolume(volume) {
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    store.set('volume', normalizedVolume);
    
    this.audioElements.forEach(audio => {
      audio.volume = normalizedVolume / 100;
    });

    return normalizedVolume;
  }
}

module.exports = new VolumeManager();