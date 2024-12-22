// Renderer process

// UI Elements
const connectionStatus = document.getElementById('connection-status');
const deviceToken = document.getElementById('device-token');
const currentTrack = document.getElementById('current-track');
const audioPlayer = document.getElementById('audio-player');

// IPC ile main process'ten gelen mesajları dinle
window.electron.receive('connection-status', (status) => {
    connectionStatus.textContent = status;
});

window.electron.receive('device-info', (info) => {
    deviceToken.textContent = info.token;
});

window.electron.receive('track-update', (track) => {
    currentTrack.textContent = `${track.title} - ${track.artist}`;
    audioPlayer.src = track.path;
    audioPlayer.play();
});

// Audio player events
audioPlayer.addEventListener('ended', () => {
    window.electron.send('track-ended');
});

audioPlayer.addEventListener('error', (e) => {
    console.error('Audio player error:', e);
    window.electron.send('player-error', e.message);
});