class AnnouncementManager {
  constructor() {
    if (AnnouncementManager.instance) {
      return AnnouncementManager.instance;
    }
    
    this.currentAnnouncement = null;
    this.playlistState = {
      wasPlaying: false,
      handler: null
    };
    
    AnnouncementManager.instance = this;
    console.log('AnnouncementManager initialized');
  }

  isAnnouncementPlaying() {
    return this.currentAnnouncement !== null;
  }

  async startAnnouncement(id, handler) {
    console.log('Starting announcement:', { id, handler });
    if (this.isAnnouncementPlaying()) {
      console.log('Another announcement is already playing:', this.currentAnnouncement);
      return false;
    }

    this.currentAnnouncement = id;
    this.playlistState.handler = handler;
    return true;
  }

  savePlaylistState(wasPlaying) {
    this.playlistState.wasPlaying = wasPlaying;
    console.log('Saved playlist state:', this.playlistState);
  }

  getPlaylistState() {
    return this.playlistState;
  }

  endAnnouncement() {
    console.log('Ending announcement:', this.currentAnnouncement);
    this.currentAnnouncement = null;
    const state = { ...this.playlistState };
    this.playlistState = { wasPlaying: false, handler: null };
    return state;
  }
}

// Singleton instance'ı oluştur ve export et
const instance = new AnnouncementManager();
module.exports = instance;