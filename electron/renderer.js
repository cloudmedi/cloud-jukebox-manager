const { ipcRenderer } = require('electron');
const audio = document.getElementById('audioPlayer');

// Initialize volume
audio.volume = 0.7; // 70%

// Play/Pause toggle
document.getElementById('playButton').addEventListener('click', () => {
    if (audio.paused) {
        audio.play().catch(error => console.error('Play error:', error));
    } else {
        audio.pause();
    }
});

// Previous track
document.getElementById('prevButton').addEventListener('click', () => {
    ipcRenderer.invoke('prev-song');
});

// Next track
document.getElementById('nextButton').addEventListener('click', () => {
    ipcRenderer.invoke('next-song');
});

// Update play button icon
audio.addEventListener('play', () => {
    document.getElementById('playButton').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    `;
});

audio.addEventListener('pause', () => {
    document.getElementById('playButton').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;
});

// Progress bar updates
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
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

ipcRenderer.on('download-error', (event, data) => {
    console.error('Download error:', data);
    showError(`${data.songName}: ${data.error}`);
    hideDownloadProgress();
});

ipcRenderer.on('song-downloaded', (event, song) => {
    console.log('Song downloaded:', song);
    // Add the downloaded song to the player
    if (song.localPath) {
        updatePlayer(song);
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

function updatePlayer(song) {
    const songTitle = document.querySelector('.song-title');
    const artistName = document.querySelector('.artist');
    const songPath = document.querySelector('.song-path');
    
    if (songTitle) songTitle.textContent = song.name;
    if (artistName) artistName.textContent = song.artist;
    if (songPath) songPath.textContent = song.localPath;
    
    if (audio) {
        audio.src = song.localPath;
        audio.play().catch(err => console.error('Playback error:', err));
    }
}

// Previous track
document.getElementById('prevButton').addEventListener('click', () => {
    ipcRenderer.invoke('prev-song');
});

// Next track
document.getElementById('nextButton').addEventListener('click', () => {
    ipcRenderer.invoke('next-song');
});

// Update play button icon
audio.addEventListener('play', () => {
    document.getElementById('playButton').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    `;
});

audio.addEventListener('pause', () => {
    document.getElementById('playButton').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;
});

// Progress bar updates
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
});
