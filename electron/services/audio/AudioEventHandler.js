const AnnouncementEventHandler = require('./handlers/AnnouncementEventHandler');
const PlaylistEventHandler = require('./handlers/PlaylistEventHandler');
const playbackStateManager = require('./PlaybackStateManager');

class AudioEventHandler {
  constructor(playlistAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = document.getElementById('campaignPlayer');
    
    // Initialize handlers
    this.announcementHandler = new AnnouncementEventHandler(
      this.playlistAudio,
      this.campaignAudio
    );
    
    this.playlistHandler = new PlaylistEventHandler(
      this.playlistAudio,
      () => {
        if (!this.announcementHandler.isPlaying()) {
          console.log('Song ended naturally, invoking song-ended');
          require('electron').ipcRenderer.invoke('song-ended');
        }
      }
    );
  }

  async playCampaign(audioUrl) {
    return this.announcementHandler.playAnnouncement(audioUrl);
  }

  setVolume(volume) {
    const normalizedVolume = volume / 100;
    this.playlistAudio.volume = normalizedVolume;
    this.campaignAudio.volume = normalizedVolume;
  }

  isAnnouncementActive() {
    return this.announcementHandler.isPlaying();
  }
}

module.exports = AudioEventHandler;