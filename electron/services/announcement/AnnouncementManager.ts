class AnnouncementManager {
  private static instance: AnnouncementManager;
  private currentAnnouncement: string | null = null;
  private playlistState: {
    wasPlaying: boolean;
    handler: string | null;
  } = {
    wasPlaying: false,
    handler: null
  };

  private constructor() {
    console.log('AnnouncementManager initialized');
  }

  static getInstance(): AnnouncementManager {
    if (!AnnouncementManager.instance) {
      AnnouncementManager.instance = new AnnouncementManager();
    }
    return AnnouncementManager.instance;
  }

  isAnnouncementPlaying(): boolean {
    return this.currentAnnouncement !== null;
  }

  async startAnnouncement(id: string, handler: string): Promise<boolean> {
    console.log('Starting announcement:', { id, handler });
    if (this.isAnnouncementPlaying()) {
      console.log('Another announcement is already playing:', this.currentAnnouncement);
      return false;
    }

    this.currentAnnouncement = id;
    this.playlistState.handler = handler;
    return true;
  }

  savePlaylistState(wasPlaying: boolean) {
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

export default AnnouncementManager.getInstance();