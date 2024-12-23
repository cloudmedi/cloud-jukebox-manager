const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const audio = document.getElementById('audioPlayer');

function updatePlayerUI(currentSong, playlist) {
    const artworkPlaceholder = document.getElementById('artworkPlaceholder');
    const artworkImage = document.getElementById('artworkImage');
    const playlistName = document.getElementById('playlistName');
    const artistName = document.getElementById('artistName');
    const songName = document.getElementById('songName');

    // Update playlist name
    playlistName.textContent = playlist?.name || 'No Playlist';

    // Update artwork
    if (currentSong?.artwork) {
        artworkImage.src = `http://localhost:5000${currentSong.artwork}`;
        artworkImage.style.display = 'block';
        artworkPlaceholder.style.display = 'none';

        artworkImage.onerror = () => {
            artworkImage.style.display = 'none';
            artworkPlaceholder.style.display = 'flex';
        };
    } else {
        artworkImage.style.display = 'none';
        artworkPlaceholder.style.display = 'flex';
    }

    // Update song and artist info
    artistName.textContent = currentSong?.artist || 'Unknown Artist';
    songName.textContent = currentSong?.name || 'No Song Playing';
}

// Initialize volume
audio.volume = 0.7;

ipcRenderer.on('update-player', (event, { playlist, currentSong }) => {
    console.log('Updating player with song:', currentSong);
    if (currentSong && currentSong.localPath) {
        const normalizedPath = currentSong.localPath.replace(/\\/g, '/');
        audio.src = normalizedPath;
        audio.play().catch(err => console.error('Playback error:', err));
        updatePlayerUI(currentSong, playlist);
    }
});

// Auto-play playlist
ipcRenderer.on('auto-play-playlist', (event, playlist) => {
    console.log('Auto-playing playlist:', playlist);
    if (playlist && playlist.songs && playlist.songs.length > 0) {
        ipcRenderer.invoke('play-playlist', playlist);
    }
});

// Handle song ended
audio.addEventListener('ended', () => {
    console.log('Song ended, playing next');
    ipcRenderer.invoke('song-ended');
});

// Display initial playlists
const playlists = store.get('playlists', []);
if (playlists.length > 0) {
    const lastPlaylist = playlists[playlists.length - 1];
    if (lastPlaylist.songs && lastPlaylist.songs.length > 0) {
        updatePlayerUI(lastPlaylist.songs[0], lastPlaylist);
    }
}