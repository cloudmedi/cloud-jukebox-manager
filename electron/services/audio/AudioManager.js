const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class AudioManager {
  constructor() {
    this.playlistAudio = document.getElementById('audioPlayer');
    this.campaignAudio = document.getElementById('campaignPlayer');
    this.songCounter = 0;
    this.isAnnouncementPlaying = false;
    this.currentAnnouncement = null;
    this.wasPlaylistPlaying = false;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Playlist audio events
    this.playlistAudio.addEventListener('ended', () => {
      console.log('Song ended, checking for announcement...');
      if (!this.isAnnouncementPlaying) {
        ipcRenderer.invoke('song-ended');
      }
    });

    this.playlistAudio.addEventListener('play', () => {
      console.log('Playlist started playing');
      if (!this.isAnnouncementPlaying) {
        ipcRenderer.send('playback-status-changed', true);
      }
    });

    this.playlistAudio.addEventListener('pause', () => {
      console.log('Playlist paused');
      if (!this.isAnnouncementPlaying) {
        ipcRenderer.send('playback-status-changed', false);
      }
    });

    // Campaign audio events
    this.campaignAudio.addEventListener('play', () => {
      console.log('Announcement started');
      this.isAnnouncementPlaying = true;
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      this.playlistAudio.pause();
    });

    this.campaignAudio.addEventListener('ended', () => {
      console.log('Announcement ended');
      this.isAnnouncementPlaying = false;
      this.currentAnnouncement = null;
      
      // Anons bittiğinde bir sonraki şarkıya geç
      ipcRenderer.invoke('song-ended').then(() => {
        if (this.wasPlaylistPlaying) {
          this.playlistAudio.play().catch(err => console.error('Resume playback error:', err));
        }
      });
    });
  }

  async playAnnouncement(announcement) {
    try {
      console.log('Playing announcement:', announcement);
      
      if (!announcement.localPath) {
        throw new Error('Announcement file path not found');
      }

      this.currentAnnouncement = announcement;
      this.campaignAudio.src = announcement.localPath;
      this.campaignAudio.volume = 1.0;
      await this.campaignAudio.play();
      
      return true;
    } catch (error) {
      console.error('Error playing announcement:', error);
      return false;
    }
  }

  setVolume(volume) {
    const normalizedVolume = volume / 100;
    this.playlistAudio.volume = normalizedVolume;
    if (this.campaignAudio) {
      this.campaignAudio.volume = normalizedVolume;
    }
  }

  resetSongCounter() {
    this.songCounter = 0;
  }
}

module.exports = AudioManager;