const { ipcRenderer } = require('electron');
const deviceService = require('../deviceService');

class UIManager {
    constructor() {
        this.deviceInfoElement = document.getElementById('deviceInfo');
        this.tokenDisplay = this.deviceInfoElement?.querySelector('.token-display');
        this.connectionStatus = this.deviceInfoElement?.querySelector('.connection-status');
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
        if (this.tokenDisplay) {
            this.tokenDisplay.textContent = `Token: ${token}`;
        }
    }

    updateConnectionStatus(isConnected) {
        if (this.deviceInfoElement && this.connectionStatus) {
            if (isConnected) {
                // Token bilgilerini gizle
                this.deviceInfoElement.style.display = 'none';
                
                // Eşleşme mesajını göster
                this.connectionStatus.className = 'connection-status connected';
                this.connectionStatus.textContent = 'Cihaz başarıyla eşleştirildi. Şimdi bir çalma listesi ekleyebilirsiniz.';
                this.connectionStatus.style.display = 'block';
            } else {
                // Token bilgilerini göster
                this.deviceInfoElement.style.display = 'block';
                
                // Eşleşme mesajını gizle
                this.connectionStatus.style.display = 'none';
            }
        }
    }

    // Playlist yüklendiğinde çağrılacak method
    hideConnectionStatus() {
        if (this.connectionStatus) {
            this.connectionStatus.style.display = 'none';
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