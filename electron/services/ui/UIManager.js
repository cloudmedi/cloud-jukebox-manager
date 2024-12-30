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
            this.deviceInfoElement.style.display = 'none';
        } else {
            this.deviceInfoElement.style.display = 'block';
            this.connectionStatus.className = 'connection-status';
            this.connectionStatus.textContent = 'Şu anda bir çalma listesi yok. Lütfen bir çalma listesi ekleyin.';
        }
    }

    displayPlaylists(playlist) {
        const playlistContainer = document.getElementById('playlistContainer');
        if (!playlistContainer) return;

        playlistContainer.innerHTML = '';

        if (playlist) {
            const playlistElement = document.createElement('div');
            playlistElement.className = 'playlist-item';
            playlistElement.innerHTML = `
                <div class="playlist-info">
                    ${playlist.artwork ? 
                        `<img src="${playlist.artwork}" alt="${playlist.name}" class="playlist-artwork"/>` :
                        '<div class="playlist-artwork-placeholder"></div>'
                    }
                    <div class="playlist-details">
                        <h3>${playlist.name}</h3>
                        <p>${playlist.songs[0]?.artist || 'Unknown Artist'}</p>
                        <p>${playlist.songs[0]?.name || 'No songs'}</p>
                    </div>
                </div>
            `;
            
            playlistContainer.appendChild(playlistElement);
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