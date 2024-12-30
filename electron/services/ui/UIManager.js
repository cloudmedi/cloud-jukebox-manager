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
        if (isConnected) {
            // Bağlantı başarılı olduğunda token bilgilerini gizle
            if (this.deviceInfoElement) {
                this.deviceInfoElement.style.display = 'none';
            }
            
            // Yeni mesajı göster
            if (this.connectionStatus) {
                this.connectionStatus.className = 'connection-status connected';
                this.connectionStatus.textContent = 'Cihaz başarıyla eşleştirildi. Şimdi bir çalma listesi ekleyebilirsiniz.';
            }
        } else {
            // Bağlantı koptuğunda token bilgilerini göster
            if (this.deviceInfoElement) {
                this.deviceInfoElement.style.display = 'block';
            }
            
            if (this.connectionStatus) {
                this.connectionStatus.className = 'connection-status disconnected';
                this.connectionStatus.textContent = 'Cihaz başarıyla eşleştirildi. Şimdi bir çalma listesi ekleyebilirsiniz.';
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
