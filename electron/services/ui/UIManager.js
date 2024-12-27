const deviceService = require('../deviceService');

class UIManager {
    constructor() {
        this.deviceInfoElement = null;
        this.tokenDisplay = null;
        this.connectionStatus = null;
        this.downloadProgress = null;
        this.downloadProgressBar = null;
        this.downloadProgressText = null;
        this.errorContainer = null;
        
        window.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, initializing UI elements...');
            this.initializeElements();
            this.initializeUI();
        });
    }

    initializeElements() {
        console.log('Initializing UI elements...');
        this.deviceInfoElement = document.getElementById('deviceInfo');
        
        if (this.deviceInfoElement) {
            this.tokenDisplay = this.deviceInfoElement.querySelector('.token-display');
            this.connectionStatus = this.deviceInfoElement.querySelector('.connection-status');
        } else {
            console.error('Device info element not found!');
            return;
        }

        this.downloadProgress = document.querySelector('.download-progress');
        this.downloadProgressBar = document.querySelector('.download-progress-bar');
        this.downloadProgressText = document.querySelector('.download-progress-text');
        this.errorContainer = document.getElementById('errorContainer');
        
        console.log('UI elements initialized:', {
            deviceInfoFound: !!this.deviceInfoElement,
            tokenDisplayFound: !!this.tokenDisplay,
            connectionStatusFound: !!this.connectionStatus
        });
    }

    async initializeUI() {
        if (!this.deviceInfoElement || !this.tokenDisplay) {
            console.error('Cannot initialize UI: Required elements not found');
            return;
        }

        console.log('Initializing UI...');
        try {
            const token = await deviceService.getStoredToken();
            console.log('Retrieved or generated token:', token);
            
            if (token) {
                this.updateDeviceInfo(token);
                console.log('UI initialized with token:', token);
            } else {
                console.error('No token available after initialization');
                this.showError('Token oluşturulamadı');
            }
        } catch (error) {
            console.error('UI initialization error:', error);
            this.showError('Token oluşturma hatası: ' + error.message);
        }
    }

    updateDeviceInfo(token) {
        console.log('Updating device info with token:', token);
        if (this.tokenDisplay && token) {
            this.tokenDisplay.textContent = `Token: ${token}`;
            this.deviceInfoElement.style.display = 'block';
            console.log('Token display updated');
        } else {
            console.error('Token display element not found or token is null');
        }
    }

    updateConnectionStatus(isConnected) {
        if (!this.connectionStatus) return;

        if (isConnected) {
            this.deviceInfoElement.style.display = 'none';
        } else {
            this.deviceInfoElement.style.display = 'block';
        }
        
        this.connectionStatus.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
        this.connectionStatus.textContent = isConnected ? 'Bağlı' : 'Bağlantı Kesildi';
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
        
        if (this.errorContainer) {
            this.errorContainer.appendChild(errorElement);
            
            setTimeout(() => {
                errorElement.remove();
            }, duration);
        }
    }
}

module.exports = new UIManager();
