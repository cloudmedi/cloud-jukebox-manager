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
        this.warningMessage = document.getElementById('warningMessage');
        this.playlistContainer = document.getElementById('playlistContainer');
        
        // Başlangıçta sadece device info görünür olmalı
        this.deviceInfoElement.style.display = 'block';
        this.warningMessage.style.display = 'none';
        this.playlistContainer.style.display = 'none';
        
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
            // Bağlantı varsa token bilgisini gizle
            this.deviceInfoElement.style.display = 'none';
            
            // Playlist kontrolü
            const hasPlaylist = this.playlistContainer.children.length > 0;
            
            // Playlist yoksa uyarı göster, varsa playlist container'ı göster
            this.warningMessage.style.display = hasPlaylist ? 'none' : 'block';
            this.playlistContainer.style.display = hasPlaylist ? 'block' : 'none';
        } else {
            // Bağlantı yoksa sadece token bilgisini göster
            this.deviceInfoElement.style.display = 'block';
            this.warningMessage.style.display = 'none';
            this.playlistContainer.style.display = 'none';
        }
        
        this.connectionStatus.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
        this.connectionStatus.textContent = isConnected ? 'Bağlı' : 'Bağlantı Kesildi';
    }

    displayPlaylists(playlist) {
        if (!playlist || !playlist.songs || playlist.songs.length === 0) {
            this.warningMessage.style.display = 'block';
            this.playlistContainer.style.display = 'none';
            return;
        }

        this.warningMessage.style.display = 'none';
        this.playlistContainer.style.display = 'block';
        this.playlistContainer.innerHTML = '';
        
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
        
        this.playlistContainer.appendChild(playlistElement);
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
