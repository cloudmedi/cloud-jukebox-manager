class AnnouncementEventHandler {
  constructor(playlistAudio, campaignAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = campaignAudio;
    this.isAnnouncementPlaying = false;
    this.wasPlaylistPlaying = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Campaign audio event listeners
    this.campaignAudio.addEventListener('play', () => {
      console.log('Announcement started, pausing playlist');
      this.isAnnouncementPlaying = true;
      this.wasPlaylistPlaying = !this.playlistAudio.paused;
      this.playlistAudio.pause();
    });

    this.campaignAudio.addEventListener('ended', () => {
      console.log('Announcement ended, cleaning up');
      this.cleanupAnnouncement();
    });

    this.campaignAudio.addEventListener('error', (error) => {
      console.error('Announcement playback error:', error);
      this.cleanupAnnouncement();
    });
  }

  cleanupAnnouncement() {
    console.log('Cleaning up announcement state');
    this.isAnnouncementPlaying = false;
    this.campaignAudio.src = '';
    
    // Notify that announcement has ended
    require('electron').ipcRenderer.send('announcement-ended');
    
    // Resume playlist if it was playing
    if (this.wasPlaylistPlaying) {
      console.log('Resuming playlist after announcement');
      this.playlistAudio.play().catch(err => {
        console.error('Error resuming playlist:', err);
      });
    }
  }

  async playAnnouncement(audioPath) {
    if (!audioPath) {
      console.error('No audio path provided for announcement');
      return false;
    }

    try {
      this.campaignAudio.src = audioPath;
      await this.campaignAudio.play();
      return true;
    } catch (err) {
      console.error('Announcement playback error:', err);
      this.cleanupAnnouncement();
      return false;
    }
  }

  isPlaying() {
    return this.isAnnouncementPlaying;
  }
}

module.exports = AnnouncementEventHandler;