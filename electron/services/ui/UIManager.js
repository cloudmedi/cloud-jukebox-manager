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

    displayPlaylists(playlist) {
        const playlistContainer = document.getElementById('playlistContainer');
        if (!playlistContainer) {
            console.error('Playlist container not found');
            return;
        }

        console.log('Displaying playlist:', playlist);
        playlistContainer.innerHTML = '';

        if (!playlist || !playlist.songs || !Array.isArray(playlist.songs)) {
            console.error('Invalid playlist data:', playlist);
            return;
        }

        // Playlist başlığı
        const playlistHeader = document.createElement('div');
        playlistHeader.className = 'playlist-header';
        
        // Playlist artwork'ü
        let artworkSrc = '';
        if (playlist.artwork) {
            try {
                const fs = require('fs');
                if (fs.existsSync(playlist.artwork)) {
                    artworkSrc = 'file://' + playlist.artwork.replace(/\\/g, '/');
                    console.log('Playlist artwork path:', artworkSrc);
                }
            } catch (error) {
                console.error('Error checking playlist artwork:', error);
            }
        }

        playlistHeader.innerHTML = `
            <div class="playlist-info">
                ${artworkSrc ? 
                    `<img src="${artworkSrc}" alt="${playlist.name}" class="playlist-artwork" onerror="this.style.display='none'"/>` :
                    '<div class="playlist-artwork-placeholder"></div>'
                }
                <div class="playlist-details">
                    <h2>${playlist.name || 'Unnamed Playlist'}</h2>
                    <p>${playlist.songs.length} songs</p>
                </div>
            </div>
        `;
        playlistContainer.appendChild(playlistHeader);

        // Şarkı listesi
        const songsList = document.createElement('div');
        songsList.className = 'songs-list';

        // Her şarkı için bir element oluştur
        playlist.songs.forEach((song, index) => {
            const songElement = document.createElement('div');
            songElement.className = 'playlist-item';
            songElement.setAttribute('data-index', index);

            // Şarkı artwork'ü
            let songArtworkSrc = '';
            if (song.artworkPath) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(song.artworkPath)) {
                        songArtworkSrc = 'file://' + song.artworkPath.replace(/\\/g, '/');
                        console.log(`Artwork path for song ${index}:`, songArtworkSrc);
                    }
                } catch (error) {
                    console.error(`Error checking artwork for song ${index}:`, error);
                }
            }

            songElement.innerHTML = `
                <div class="playlist-info">
                    ${songArtworkSrc ? 
                        `<img src="${songArtworkSrc}" alt="${song.name}" class="playlist-artwork" onerror="this.style.display='none'"/>` :
                        '<div class="playlist-artwork-placeholder"></div>'
                    }
                    <div class="playlist-details">
                        <h3>${song.name || 'Unknown Song'}</h3>
                        <p>${song.artist || 'Unknown Artist'}</p>
                    </div>
                </div>
            `;

            // Status'a göre class ekle
            if (song.status === 'completed') {
                songElement.classList.add('completed');
            }

            songsList.appendChild(songElement);
        });

        playlistContainer.appendChild(songsList);
        console.log('Playlist UI updated successfully');
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