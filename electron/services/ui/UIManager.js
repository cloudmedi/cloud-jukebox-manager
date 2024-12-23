const { ipcRenderer } = require('electron');
const deviceService = require('../deviceService');

class UIManager {
    constructor() {
        this.deviceInfoElement = document.getElementById('deviceInfo');
        this.tokenDisplay = this.deviceInfoElement.querySelector('.token-display');
        this.connectionStatus = this.deviceInfoElement.querySelector('.connection-status');
        this.systemInfo = this.deviceInfoElement.querySelector('.system-info');
        this.downloadProgress = document.querySelector('.download-progress');
        this.downloadProgressBar = document.querySelector('.download-progress-bar');
        this.downloadProgressText = document.querySelector('.download-progress-text');
        this.errorContainer = document.getElementById('errorContainer');
        
        this.initializeUI();
    }

    async initializeUI() {
        // Token ve cihaz bilgilerini al
        const deviceInfo = await ipcRenderer.invoke('get-device-info');
        
        if (!deviceInfo || !deviceInfo.token) {
            // Yeni token oluştur
            const newToken = deviceService.generateToken();
            const systemInfo = deviceService.getDeviceInfo();
            
            await ipcRenderer.invoke('save-device-info', {
                token: newToken,
                ...systemInfo
            });
            
            this.updateDeviceInfo(newToken, systemInfo);
        } else {
            this.updateDeviceInfo(deviceInfo.token, deviceInfo);
        }
    }

    updateDeviceInfo(token, systemInfo) {
        // Token göster
        this.tokenDisplay.textContent = `Token: ${token}`;
        
        // Sistem bilgilerini göster
        this.systemInfo.innerHTML = `
            <div>Hostname: ${systemInfo.hostname}</div>
            <div>Platform: ${systemInfo.platform}</div>
            <div>CPU: ${systemInfo.cpus}</div>
            <div>Memory: ${systemInfo.totalMemory}</div>
            <div>IP: ${systemInfo.networkInterfaces.join(', ')}</div>
        `;
    }

    updateConnectionStatus(isConnected) {
        this.connectionStatus.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
        this.connectionStatus.textContent = isConnected ? 'Bağlı' : 'Bağlantı Kesildi';
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