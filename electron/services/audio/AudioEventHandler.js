const AnnouncementEventHandler = require('./handlers/AnnouncementEventHandler');
const PlaylistEventHandler = require('./handlers/PlaylistEventHandler');
const ScheduleEventHandler = require('./handlers/ScheduleEventHandler');
const playbackStateManager = require('./PlaybackStateManager');

class AudioEventHandler {
  constructor(playlistAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = document.getElementById('campaignPlayer');
    this.scheduleAudio = document.getElementById('schedulePlayer');
    
    // Handler'ları başlat
    this.announcementHandler = new AnnouncementEventHandler(
      this.playlistAudio,
      this.campaignAudio
    );

    this.scheduleHandler = new ScheduleEventHandler(
      this.playlistAudio,
      this.scheduleAudio
    );
    
    this.playlistHandler = new PlaylistEventHandler(
      this.playlistAudio,
      () => {
        // Sadece kampanya veya schedule çalmıyorken sonraki şarkıya geç
        if (!this.announcementHandler.isPlaying() && !this.scheduleHandler.isPlaying()) {
          console.log('Şarkı bitti, sıradaki şarkıya geçiliyor');
          require('electron').ipcRenderer.invoke('song-ended');
        }
      }
    );
  }

  async playCampaign(audioUrl) {
    console.log('Kampanya çalma isteği:', audioUrl);
    return this.announcementHandler.playAnnouncement(audioUrl);
  }

  async playSchedule(audioUrl) {
    console.log('Schedule çalma isteği:', audioUrl);
    return this.scheduleHandler.playSchedule(audioUrl);
  }

  async stopSchedule() {
    if (this.scheduleHandler) {
      this.scheduleAudio.pause();
      this.scheduleAudio.currentTime = 0;
    }
  }

  async pauseSchedule() {
    if (this.scheduleHandler) {
      this.scheduleAudio.pause();
    }
  }

  async resumeSchedule() {
    if (this.scheduleHandler) {
      await this.scheduleAudio.play();
    }
  }

  setVolume(volume) {
    if (this.playlistAudio) {
      this.playlistAudio.volume = volume;
    }
    if (this.campaignAudio) {
      this.campaignAudio.volume = volume;
    }
    if (this.scheduleAudio) {
      this.scheduleAudio.volume = volume;
    }
  }

  isAnnouncementActive() {
    return this.announcementHandler.isPlaying();
  }
}

module.exports = AudioEventHandler;