const { ipcRenderer } = require('electron');
const playbackStateManager = require('./PlaybackStateManager');

class AudioEventHandler {
  constructor(playlistAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = document.getElementById('campaignPlayer');
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Playlist audio event listeners
    this.playlistAudio.addEventListener('ended', () => {
      console.log('Song ended, playing next');
      ipcRenderer.invoke('song-ended');
    });

    this.playlistAudio.addEventListener('play', () => {
      if (this.isAnnouncementPlaying) {
        console.log('Preventing playlist play during announcement');
        this.playlistAudio.pause();
        return;
      }
      console.log('Audio started playing');
      playbackStateManager.savePlaybackState(true);
      ipcRenderer.send('playback-status-changed', true);
    });

    this.playlistAudio.addEventListener('pause', () => {
      if (!this.isAnnouncementPlaying) {
        console.log('Audio paused');
        playbackStateManager.savePlaybackState(false);
        ipcRenderer.send('playback-status-changed', false);
      }
    });

    // Campaign audio event listeners
    this.campaignAudio.addEventListener('play', () => {
      console.log('Campaign started, pausing playlist');
      this.isAnnouncementPlaying = true;
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      this.playlistAudio.pause();
    });

    this.campaignAudio.addEventListener('ended', () => {
      console.log('Campaign ended');
      this.isAnnouncementPlaying = false;
      if (this.wasPlaylistPlaying) {
        console.log('Resuming playlist');
        this.playlistAudio.play().catch(err => console.error('Resume playback error:', err));
      }
    });
  }

  // Kampanya çalma metodu
  async playCampaign(audioUrl) {
    if (audioUrl) {
      console.log('Playing campaign:', audioUrl);
      try {
        this.campaignAudio.src = audioUrl;
        await this.campaignAudio.play();
        return true;
      } catch (err) {
        console.error('Campaign playback error:', err);
        return false;
      }
    }
    return false;
  }

  // Ses seviyesi kontrolü
  setVolume(volume) {
    const normalizedVolume = volume / 100;
    this.playlistAudio.volume = normalizedVolume;
    this.campaignAudio.volume = normalizedVolume;
  }

  // Anons durumunu kontrol etme
  isAnnouncementActive() {
    return this.isAnnouncementPlaying;
  }
}

module.exports = AudioEventHandler;