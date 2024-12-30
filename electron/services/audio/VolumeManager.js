const Store = require('electron-store');
const store = new Store();

class VolumeManager {
  constructor() {
    // Varsayılan volume değeri
    this.defaultVolume = 70;
    
    // Store'dan kayıtlı volume değerini al veya varsayılanı kullan
    const savedVolume = this.getStoredVolume();
    this.setInitialVolume(savedVolume);
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
    
    // Her iki player için de volume değerini güncelle
    const audioPlayer = document.getElementById('audioPlayer');
    const campaignPlayer = document.getElementById('campaignPlayer');
    
    if (audioPlayer) {
      audioPlayer.volume = this.normalizeVolume(normalizedVolume);
      console.log('Audio player volume updated:', audioPlayer.volume);
    }
    
    if (campaignPlayer) {
      campaignPlayer.volume = this.normalizeVolume(normalizedVolume);
      console.log('Campaign player volume updated:', campaignPlayer.volume);
    }
    
    return normalizedVolume;
  }

  // Başlangıç volume değerini ayarla
  setInitialVolume(volume) {
    const audioPlayer = document.getElementById('audioPlayer');
    const campaignPlayer = document.getElementById('campaignPlayer');
    
    const normalizedVolume = this.normalizeVolume(volume);
    
    if (audioPlayer) {
      audioPlayer.volume = normalizedVolume;
    }
    
    if (campaignPlayer) {
      campaignPlayer.volume = normalizedVolume;
    }
  }

  // Volume değerini 0-1 arasına normalize et
  normalizeVolume(volume) {
    return volume / 100;
  }
}

module.exports = new VolumeManager();