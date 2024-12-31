import { playlistDownloadService } from './playlistDownloadService';

class AudioPlayerService {
  private audio: HTMLAudioElement;
  private currentPlaylist: any = null;
  private currentSongIndex: number = 0;

  constructor() {
    this.audio = new Audio();
    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    this.audio.addEventListener('ended', () => {
      this.playNext();
    });

    this.audio.addEventListener('error', (error) => {
      console.error('Audio playback error:', error);
    });
  }

  async loadPlaylist(playlist: any) {
    this.currentPlaylist = playlist;
    this.currentSongIndex = 0;
    await this.loadCurrentSong();
  }

  private async loadCurrentSong() {
    if (!this.currentPlaylist || !this.currentPlaylist.songs.length) {
      console.warn('No playlist or songs available');
      return;
    }

    const currentSong = this.currentPlaylist.songs[this.currentSongIndex];
    const songBlob = await playlistDownloadService.getSong(currentSong._id);

    if (songBlob) {
      const url = URL.createObjectURL(songBlob);
      this.audio.src = url;
      console.log(`Loaded song: ${currentSong.name}`);
    } else {
      console.error('Song not found in storage');
    }
  }

  async play() {
    try {
      await this.audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  pause() {
    this.audio.pause();
  }

  async playNext() {
    if (!this.currentPlaylist) return;

    this.currentSongIndex = (this.currentSongIndex + 1) % this.currentPlaylist.songs.length;
    await this.loadCurrentSong();
    await this.play();
  }

  async playPrevious() {
    if (!this.currentPlaylist) return;

    this.currentSongIndex = (this.currentSongIndex - 1 + this.currentPlaylist.songs.length) % this.currentPlaylist.songs.length;
    await this.loadCurrentSong();
    await this.play();
  }

  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getCurrentSong() {
    if (!this.currentPlaylist) return null;
    return this.currentPlaylist.songs[this.currentSongIndex];
  }
}

export const audioPlayerService = new AudioPlayerService();