import { toast } from "@/hooks/use-toast";
import { playlistDownloadService } from "./playlistDownloadService";

class AudioPlayerService {
  private audioElement: HTMLAudioElement;
  private currentPlaylist: any = null;
  private currentSongIndex: number = 0;

  constructor() {
    console.log('AudioPlayerService initialized');
    this.audioElement = new Audio();
    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    this.audioElement.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      toast({
        variant: "destructive",
        title: "Oynatma Hatası",
        description: "Ses dosyası yüklenirken bir hata oluştu"
      });
    });

    this.audioElement.addEventListener('loadstart', () => {
      console.log('Audio loading started');
    });

    this.audioElement.addEventListener('canplay', () => {
      console.log('Audio can play');
    });

    this.audioElement.addEventListener('playing', () => {
      console.log('Audio playing');
    });
  }

  async loadPlaylist(playlist: any) {
    try {
      console.log('Loading playlist:', playlist);
      this.currentPlaylist = playlist;
      this.currentSongIndex = 0;
      await this.loadCurrentSong();
    } catch (error) {
      console.error('Error loading playlist:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist yüklenirken bir hata oluştu"
      });
    }
  }

  private async loadCurrentSong() {
    if (!this.currentPlaylist?.songs?.length) {
      console.warn('No songs in playlist');
      return;
    }

    const song = this.currentPlaylist.songs[this.currentSongIndex];
    console.log('Loading song:', song);

    try {
      if (song.filePath.startsWith('indexeddb://')) {
        const songId = song.filePath.replace('indexeddb://', '');
        const songData = await playlistDownloadService.getSong(songId);
        if (songData) {
          const blob = new Blob([songData]);
          this.audioElement.src = URL.createObjectURL(blob);
          console.log('Loaded song from IndexedDB');
        } else {
          throw new Error('Song not found in IndexedDB');
        }
      } else {
        this.audioElement.src = `http://localhost:5000/${song.filePath}`;
        console.log('Loading song from server');
      }
    } catch (error) {
      console.error('Error loading song:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `${song.name} yüklenirken bir hata oluştu`
      });
    }
  }

  async play() {
    try {
      console.log('Play requested');
      await this.audioElement.play();
    } catch (error) {
      console.error('Play error:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast({
          title: "Kullanıcı Etkileşimi Gerekli",
          description: "Oynatmak için sayfaya tıklayın",
          duration: 5000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Şarkı oynatılırken bir hata oluştu"
        });
      }
    }
  }

  pause() {
    this.audioElement.pause();
  }

  setVolume(volume: number) {
    this.audioElement.volume = Math.max(0, Math.min(1, volume));
  }

  getCurrentSong() {
    if (!this.currentPlaylist?.songs?.length) return null;
    return this.currentPlaylist.songs[this.currentSongIndex];
  }

  get audio() {
    return this.audioElement;
  }
}

export const audioPlayerService = new AudioPlayerService();