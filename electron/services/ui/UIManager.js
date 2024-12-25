const { ipcRenderer } = require('electron');
const deviceService = require('../deviceService');

class UIManager {
    constructor() {
        this.deviceInfoElement = document.getElementById('deviceInfo');
        this.tokenDisplay = this.deviceInfoElement.querySelector('.token-display');
        this.connectionStatus = this.deviceInfoElement.querySelector('.connection-status');
        this.downloadProgress = document.querySelector('.download-progress');
        this.downloadProgressBar = document.querySelector('.download-progress-bar');
        this.downloadProgressText = document.querySelector('.download-progress-text');
        this.errorContainer = document.getElementById('errorContainer');
        
        this.initializeUI();
    }

    async initializeUI() {
        const deviceInfo = await ipcRenderer.invoke('get-device-info');
        
        if (!deviceInfo || !deviceInfo.token) {
            try {
                const newToken = await deviceService.registerDeviceToken();
                await ipcRenderer.invoke('save-device-info', {
                    token: newToken
                });
                
                this.updateDeviceInfo(newToken);
            } catch (error) {
                this.showError('Token oluşturma hatası: ' + error.message);
            }
        } else {
            this.updateDeviceInfo(deviceInfo.token);
        }
    }

    updateDeviceInfo(token) {
        this.tokenDisplay.textContent = `Token: ${token}`;
    }

    updateConnectionStatus(isConnected) {
        if (isConnected) {
            // Bağlantı başarılı olduğunda token bilgilerini gizle
            this.deviceInfoElement.style.display = 'none';
        } else {
            // Bağlantı koptuğunda token bilgilerini göster
            this.deviceInfoElement.style.display = 'block';
        }
        
        this.connectionStatus.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
        this.connectionStatus.textContent = isConnected ? 'Bağlı' : 'Bağlantı Kesildi';
    }

    displayPlaylists() {
        const playlistContainer = document.getElementById('playlistContainer');
        if (!playlistContainer) return;

        const currentSong = this.queueManager.getCurrentSong();
        const nextSong = this.queueManager.peekNext();

        if (currentSong) {
            const currentSongName = document.querySelector('.current-song-name');
            const currentSongArtist = document.querySelector('.current-song-artist');
            const nextSongName = document.querySelector('.next-song-name');
            const nextSongArtist = document.querySelector('.next-song-artist');

            if (currentSongName) currentSongName.textContent = currentSong.name;
            if (currentSongArtist) currentSongArtist.textContent = currentSong.artist;

            if (nextSong) {
                if (nextSongName) nextSongName.textContent = nextSong.name;
                if (nextSongArtist) nextSongArtist.textContent = nextSong.artist;
            }

            const artwork = document.querySelector('.playlist-artwork-placeholder');
            if (artwork && currentSong.artwork) {
                artwork.style.backgroundImage = `url(${currentSong.artwork})`;
            }
        }
    }

    showDownloadProgress(progress, fileName) {
        this.downloadProgress.style.display = 'block';
        this.downloadProgressBar.style.width = `${progress}%`;
        this.downloadProgressText.textContent = `${fileName} indiriliyor... ${progress}%`;
        
        if (progress >= 100) {
            setTimeout(() => {
                this.downloadProgress.style.display = 'none';
            }, 1000);
        }
    }

    showError(message, duration = 5000) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        this.errorContainer.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.remove();
        }, duration);
    }
}

module.exports = new UIManager();
