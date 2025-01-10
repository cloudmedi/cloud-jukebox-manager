const Store = require('electron-store');
const store = new Store();

class VolumeController {
    constructor() {
        if (VolumeController.instance) {
            return VolumeController.instance;
        }
        VolumeController.instance = this;
        this.audioPlayer = null;
        this.campaignPlayer = null;
        this.schedulePlayer = null;
        this.volume = store.get('volume', 100);
        this.initialize();
    }

    static getInstance() {
        if (!VolumeController.instance) {
            VolumeController.instance = new VolumeController();
        }
        return VolumeController.instance;
    }

    initialize() {
        // DOM elementlerini al
        this.audioPlayer = document.getElementById('audioPlayer');
        this.campaignPlayer = document.getElementById('campaignPlayer');
        this.schedulePlayer = document.getElementById('schedulePlayer');

        // Başlangıç ses seviyesini ayarla
        this.setInitialVolume();
    }

    setInitialVolume() {
        const normalizedVolume = this.getNormalizedVolume();

        // Her player için ses seviyesini ayarla
        if (this.audioPlayer) {
            this.audioPlayer.volume = normalizedVolume;
            console.log('Audio player volume set:', normalizedVolume);
        }

        if (this.campaignPlayer) {
            this.campaignPlayer.volume = normalizedVolume;
            console.log('Campaign player volume set:', normalizedVolume);
        }

        if (this.schedulePlayer) {
            this.schedulePlayer.volume = normalizedVolume;
            console.log('Schedule player volume set:', normalizedVolume);
        }
    }

    updateVolume(volume) {
        // Volume'u kaydet
        const savedVolume = this.setVolume(volume);
        const normalizedVolume = this.getNormalizedVolume();

        // Her player için ses seviyesini güncelle
        if (this.audioPlayer) {
            this.audioPlayer.volume = normalizedVolume;
            console.log('Audio player volume updated:', normalizedVolume);
        }

        if (this.campaignPlayer) {
            this.campaignPlayer.volume = normalizedVolume;
            console.log('Campaign player volume updated:', normalizedVolume);
        }

        if (this.schedulePlayer) {
            this.schedulePlayer.volume = normalizedVolume;
            console.log('Schedule player volume updated:', normalizedVolume);
        }

        return savedVolume;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        store.set('volume', this.volume);
        return this.volume;
    }

    getVolume() {
        return this.volume;
    }

    getNormalizedVolume() {
        return this.volume / 100;
    }
}

module.exports = VolumeController;
