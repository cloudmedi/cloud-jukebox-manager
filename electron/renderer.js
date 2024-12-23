const { ipcRenderer } = require('electron');
const audio = document.getElementById('audioPlayer');

// Initialize volume
audio.volume = 0.7; // 70%

// Play/Pause toggle
document.getElementById('playButton').addEventListener('click', async () => {
    try {
        const isPlaying = await ipcRenderer.invoke('play-pause');
        updatePlayButton(isPlaying);
    } catch (error) {
        console.error('Play/Pause error:', error);
    }
});

// Previous track
document.getElementById('prevButton').addEventListener('click', async () => {
    console.log('Previous button clicked');
    try {
        const success = await ipcRenderer.invoke('prev-song');
        if (!success) {
            console.log('Could not play previous song');
        }
    } catch (err) {
        console.error('Error invoking prev-song:', err);
    }
});

// Next track
document.getElementById('nextButton').addEventListener('click', async () => {
    console.log('Next button clicked');
    try {
        const success = await ipcRenderer.invoke('next-song');
        if (!success) {
            console.log('Could not play next song');
        }
    } catch (err) {
        console.error('Error invoking next-song:', err);
    }
});

function updatePlayButton(isPlaying) {
    const playButton = document.getElementById('playButton');
    if (isPlaying) {
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
    } else {
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
    }
}

// Progress bar updates
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    
    // Şarkı sonuna yaklaşıldığında kontrol et
    if (audio.duration > 0 && audio.currentTime >= audio.duration - 0.5) {
        console.log('Song near end, requesting next song');
        ipcRenderer.invoke('next-song').catch(err => {
            console.error('Error invoking next-song near end:', err);
        });
    }
});

// Download progress handling
const downloadProgress = document.querySelector('.download-progress');
const downloadProgressBar = document.querySelector('.download-progress-bar');
const downloadProgressText = document.querySelector('.download-progress-text');

ipcRenderer.on('download-progress', (event, data) => {
    console.log('Download progress:', data);
    
    if (data.error) {
        showError(data.error);
        hideDownloadProgress();
    } else {
        showDownloadProgress(data);
    }
});

function showDownloadProgress(data) {
    downloadProgress.style.display = 'block';
    downloadProgressBar.style.width = `${data.progress}%`;
    downloadProgressText.textContent = `İndiriliyor: ${data.songName} (${Math.round(data.progress)}%)`;
    
    if (data.progress === 100) {
        setTimeout(hideDownloadProgress, 2000);
    }
}

function hideDownloadProgress() {
    downloadProgress.style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'download-error';
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <div class="error-message">
                <strong>İndirme Hatası</strong>
                <p>${message}</p>
            </div>
            <button class="error-close">×</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    errorDiv.querySelector('.error-close').onclick = () => {
        errorDiv.remove();
    };
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// WebSocket mesajlarını dinle
ipcRenderer.on('playlist-received', (event, playlist) => {
    console.log('Playlist received:', playlist);
    ipcRenderer.invoke('play-playlist', playlist).catch(err => {
        console.error('Error starting playlist:', err);
    });
});