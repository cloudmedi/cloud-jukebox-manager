const Store = require('electron-store');
const store = new Store();

class VolumeManager {
  constructor() {
    this.defaultVolume = 70;
  }

  getStoredVolume() {
    const volume = store.get('volume', this.defaultVolume);
    console.log('Retrieved stored volume:', volume);
    return volume;
  }

  saveVolume(volume) {
    console.log('Saving volume:', volume);
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    store.set('volume', normalizedVolume);
    console.log('Volume saved to store:', normalizedVolume);
    
    // Her iki player için de volume değerini güncelle
    const audioPlayer = document.getElementById('audioPlayer');
    const campaignPlayer = document.getElementById('campaignPlayer');
    
    const normalizedAudioVolume = this.normalizeVolume(normalizedVolume);
    
    if (audioPlayer) {
      audioPlayer.volume = normalizedAudioVolume;
      console.log('Audio player volume updated:', audioPlayer.volume);
    }
    
    if (campaignPlayer) {
      campaignPlayer.volume = normalizedAudioVolume;
      console.log('Campaign player volume updated:', campaignPlayer.volume);
    }
    
    return normalizedVolume;
  }

  normalizeVolume(volume) {
    return volume / 100;
  }
}

module.exports = new VolumeManager();