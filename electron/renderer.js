const { ipcRenderer } = require('electron');
const audio = document.getElementById('audioPlayer');
require('./services/playlistHandler');

// Audio player UI controls and event listeners
let isPlaying = false;
let playPromise = null;
let currentVolume = 0.7; // 70%

// Initialize volume
audio.volume = currentVolume;

// Play/Pause toggle
document.getElementById('playButton').addEventListener('click', () => {
    if (isPlaying) {
        audio.pause();
    } else {
        playPromise = audio.play();
        playPromise.catch(error => console.error('Play error:', error));
    }
    isPlaying = !isPlaying;
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
    isPlaying = true;
    document.getElementById('playButton').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    `;
});

audio.addEventListener('pause', () => {
    isPlaying = false;
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

// Handle playlist messages from main process
ipcRenderer.on('update-player', (event, song) => {
    if (song) {
        console.log('Received song:', song);
        const songTitle = document.querySelector('.song-title');
        const artistName = document.querySelector('.artist');
        const songPath = document.querySelector('.song-path');
        const albumArtwork = document.getElementById('albumArtwork');
        
        songTitle.textContent = song.name;
        artistName.textContent = song.artist;
        songPath.textContent = song.localPath;
        
        if (song.artwork) {
            albumArtwork.src = song.artwork;
            albumArtwork.classList.remove('loading');
        } else {
            albumArtwork.src = 'placeholder-artwork.png';
            albumArtwork.classList.add('loading');
        }
        
        audio.src = song.localPath;
        audio.play().catch(err => console.error('Playback error:', err));
    }
});

// Download progress and error listener
ipcRenderer.on('download-progress', (event, data) => {
    console.log('Download progress:', data);
    const downloadProgress = document.querySelector('.download-progress');
    const downloadProgressBar = document.querySelector('.download-progress-bar');
    const downloadProgressText = document.querySelector('.download-progress-text');

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

// Error handling
audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
});
