const { ipcRenderer } = require('electron');
const audio = document.getElementById('audioPlayer');
const playButton = document.getElementById('playButton');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const progressBar = document.getElementById('progressBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');
const songTitle = document.querySelector('.song-title');
const artistName = document.querySelector('.artist');
const songPath = document.querySelector('.song-path');
const downloadProgress = document.querySelector('.download-progress');
const downloadProgressBar = document.querySelector('.download-progress-bar');
const downloadProgressText = document.querySelector('.download-progress-text');
const volumeBar = document.getElementById('volumeBar');
const volumeButton = document.getElementById('volumeButton');
const albumArtwork = document.getElementById('albumArtwork');

// Add volume control IPC listener
ipcRenderer.on('set-volume', (event, volume) => {
  console.log('Received volume change command:', volume);
  if (audio && !isNaN(volume)) {
    currentVolume = volume / 100; // Convert to 0-1 range
    audio.volume = currentVolume;
    updateVolumeUI();
    console.log('Volume updated to:', volume);
  }
});

// Window controls
document.getElementById('minimizeButton').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

document.getElementById('maximizeButton').addEventListener('click', () => {
    ipcRenderer.send('maximize-window');
});

document.getElementById('closeButton').addEventListener('click', () => {
    ipcRenderer.send('close-window');
});

let isPlaying = false;
let playPromise = null;
let isDraggingProgress = false;
let isDraggingVolume = false;
let currentVolume = 0.7; // 70%

// Initialize volume
audio.volume = currentVolume;
updateVolumeUI();

// Play/Pause toggle
playButton.addEventListener('click', () => {
    if (isPlaying) {
        if (playPromise !== null) {
            playPromise
                .then(() => audio.pause())
                .catch(error => console.error('Pause error:', error));
        } else {
            audio.pause();
        }
    } else {
        playPromise = audio.play();
        playPromise.catch(error => console.error('Play error:', error));
    }
});

// Previous track
prevButton.addEventListener('click', () => {
    ipcRenderer.invoke('prev-song');
});

// Next track
nextButton.addEventListener('click', () => {
    ipcRenderer.invoke('next-song');
});

// Update play button icon
audio.addEventListener('play', () => {
    isPlaying = true;
    playButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    `;
    playButton.classList.add('playing');
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    playPromise = null;
    playButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;
    playButton.classList.remove('playing');
});

// Progress bar updates
audio.addEventListener('timeupdate', () => {
    if (!isDraggingProgress) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = progress + '%';
        currentTimeSpan.textContent = formatTime(audio.currentTime);
    }
});

audio.addEventListener('loadedmetadata', () => {
    durationSpan.textContent = formatTime(audio.duration);
});

// Progress bar interaction
const progressContainer = document.querySelector('.progress-bar');
progressContainer.addEventListener('mousedown', (e) => {
    isDraggingProgress = true;
    updateProgressFromMouse(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDraggingProgress) {
        updateProgressFromMouse(e);
    }
});

document.addEventListener('mouseup', () => {
    if (isDraggingProgress) {
        isDraggingProgress = false;
    }
});

function updateProgressFromMouse(e) {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
    progressBar.style.width = (pos * 100) + '%';
}

// Volume control
const volumeContainer = document.querySelector('.volume-slider');
volumeContainer.addEventListener('mousedown', (e) => {
    isDraggingVolume = true;
    updateVolumeFromMouse(e);
});

document.addEventListener('mousemove', (e) => {
    if (isDraggingVolume) {
        updateVolumeFromMouse(e);
    }
});

document.addEventListener('mouseup', () => {
    isDraggingVolume = false;
});

volumeButton.addEventListener('click', toggleMute);

function updateVolumeFromMouse(e) {
    const rect = volumeContainer.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    currentVolume = pos;
    audio.volume = pos;
    updateVolumeUI();
}

function toggleMute() {
    audio.muted = !audio.muted;
    updateVolumeUI();
}

function updateVolumeUI() {
    const effectiveVolume = audio.muted ? 0 : currentVolume;
    volumeBar.style.width = (effectiveVolume * 100) + '%';
    
    volumeButton.innerHTML = getVolumeIcon(effectiveVolume);
}

function getVolumeIcon(volume) {
    if (volume === 0) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>`;
    } else if (volume < 0.5) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>`;
    } else {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>`;
    }
}

// Format time in minutes:seconds
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// İndirme hatası bildirimi için yeni fonksiyon
function showDownloadError(error, songName) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'download-error';
    errorDiv.innerHTML = `
        <div class="error-content">
            <div class="error-icon">❌</div>
            <div class="error-message">
                <strong>${songName || 'Şarkı'} indirilemedi</strong>
                <p>${error}</p>
            </div>
            <button class="error-close">×</button>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // 5 saniye sonra otomatik kaybol
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);

    // Kapatma butonu işlevselliği
    const closeButton = errorDiv.querySelector('.error-close');
    closeButton.addEventListener('click', () => {
        errorDiv.remove();
    });
}

// İndirme ilerlemesi ve hata dinleyicisi
ipcRenderer.on('download-progress', (event, data) => {
    console.log('Download progress:', data);
    if (data.error) {
        showDownloadError(data.error, data.songName);
        downloadProgress.style.display = 'none';
    } else if (data.progress !== undefined) {
        downloadProgress.style.display = 'block';
        downloadProgressBar.style.width = `${data.progress}%`;
        downloadProgressText.textContent = `İndiriliyor: ${data.songName || 'Şarkı'} (${Math.round(data.progress)}%)`;
        
        if (data.progress === 100) {
            setTimeout(() => {
                downloadProgress.style.display = 'none';
            }, 2000);
        }
    }
});

// Handle playlist messages from main process
ipcRenderer.on('update-player', (event, song) => {
    if (song) {
        console.log('Received song:', song);
        songTitle.textContent = song.name;
        artistName.textContent = song.artist;
        songPath.textContent = song.localPath;
        
        // Update artwork
        if (song.artwork) {
            albumArtwork.src = song.artwork;
            albumArtwork.classList.remove('loading');
        } else {
            albumArtwork.src = 'placeholder-artwork.png';
            albumArtwork.classList.add('loading');
        }
        
        if (playPromise !== null) {
            playPromise
                .then(() => {
                    audio.src = song.localPath;
                    playPromise = audio.play();
                    playPromise.catch(err => console.error('Playback error:', err));
                })
                .catch(err => console.error('Previous playback error:', err));
        } else {
            audio.src = song.localPath;
            playPromise = audio.play();
            playPromise.catch(err => console.error('Playback error:', err));
        }
    }
});

// Handle download progress updates
ipcRenderer.on('download-progress', (event, data) => {
    console.log('Download progress:', data);
    if (data.progress !== undefined) {
        downloadProgress.style.display = 'block';
        downloadProgressBar.style.width = `${data.progress}%`;
        downloadProgressText.textContent = `İndiriliyor: ${data.songName || 'Şarkı'} (${Math.round(data.progress)}%)`;
        
        if (data.progress === 100) {
            setTimeout(() => {
                downloadProgress.style.display = 'none';
            }, 2000);
        }
    }
});

// Error handling
audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    playPromise = null;
});

