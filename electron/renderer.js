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

let isPlaying = false;
let playPromise = null;

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
});

audio.addEventListener('pause', () => {
    isPlaying = false;
    playPromise = null;
    playButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;
});

// Progress bar updates
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = progress + '%';
    currentTimeSpan.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
    durationSpan.textContent = formatTime(audio.duration);
});

// Click on progress bar to seek
document.querySelector('.progress').addEventListener('click', (e) => {
    const rect = e.target.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
});

// Format time in minutes:seconds
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Handle playlist messages from main process
ipcRenderer.on('update-player', (event, song) => {
    if (song) {
        console.log('Received song:', song);
        songTitle.textContent = song.name;
        artistName.textContent = song.artist;
        songPath.textContent = song.localPath;
        
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

// Error handling
audio.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    playPromise = null;
});