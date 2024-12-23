const { ipcMain } = require('electron');
const path = require('path');
const { Howl } = require('howler');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.setupIpcHandlers();
  }

  setupIpcHandlers() {
    ipcMain.handle('play-playlist', async (event, playlist) => {
      console.log('Received playlist:', playlist);
      this.playlist = playlist;
      this.currentIndex = 0;
      this.playCurrentSong();
    });

    ipcMain.handle('play-pause', () => {
      if (this.currentSound) {
        if (this.currentSound.playing()) {
          this.currentSound.pause();
        } else {
          this.currentSound.play();
        }
      }
    });

    ipcMain.handle('next-song', () => {
      if (this.playlist && this.playlist.songs.length > 0) {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.songs.length;
        this.playCurrentSong();
      }
    });

    ipcMain.handle('prev-song', () => {
      if (this.playlist && this.playlist.songs.length > 0) {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.songs.length) % this.playlist.songs.length;
        this.playCurrentSong();
      }
    });
  }

  playCurrentSong() {
    if (!this.playlist || !this.playlist.songs.length) {
      console.log('No playlist or songs available');
      return;
    }

    const song = this.playlist.songs[this.currentIndex];
    if (!song) {
      console.log('No song at index:', this.currentIndex);
      return;
    }

    console.log('Playing song:', song);

    if (this.currentSound) {
      this.currentSound.unload();
    }

    // Doğrudan server'dan şarkıyı çal
    const serverUrl = 'http://localhost:5000';
    const songUrl = `${serverUrl}/${song.filePath.replace(/\\/g, '/')}`;
    console.log('Playing from URL:', songUrl);

    this.currentSound = new Howl({
      src: [songUrl],
      html5: true,
      format: ['mp3'],
      onplay: () => {
        console.log('Song started playing:', song.name);
      },
      onend: () => {
        console.log('Song ended, playing next');
        this.next();
      },
      onloaderror: (id, err) => {
        console.error('Error loading song:', err);
      },
      onplayerror: (id, err) => {
        console.error('Error playing song:', err);
      }
    });

    this.currentSound.play();
  }

  next() {
    if (this.playlist && this.playlist.songs.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.songs.length;
      this.playCurrentSong();
    }
  }
}

module.exports = new AudioService();