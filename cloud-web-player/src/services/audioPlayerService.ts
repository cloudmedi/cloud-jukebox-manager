import { playlistDownloadService } from './playlistDownloadService';
import { toast } from '@/hooks/use-toast';

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
      toast({
        variant: "destructive",
        title: "Oynatma Hatası",
        description: "Şarkı oynatılırken bir hata oluştu."
      });
    });

    this.audio.addEventListener('play', () => {
      const currentSong = this.getCurrentSong();
      if (currentSong) {
        toast({
          title: "Oynatılıyor",
          description: currentSong.name
        });
      }
    });
  }

  async loadPlaylist(playlist: any) {
    try {
      console.log('Loading playlist:', playlist.name);
      
      // Önce playlist'i local storage'dan kontrol et
      const localPlaylist = await playlistDownloadService.getPlaylist(playlist._id);
      
      if (localPlaylist) {
        console.log('Loading local playlist:', localPlaylist.name);
        this.currentPlaylist = localPlaylist;
        this.currentSongIndex = 0;
        await this.loadCurrentSong();
        await this.play();
        
        toast({
          title: "Playlist Hazır",
          description: `${localPlaylist.name} yerel depodan yüklendi`
        });
      } else {
        console.log('Loading remote playlist:', playlist.name);
        // Playlist'i locale kaydet ve şarkıları indir
        await playlistDownloadService.storePlaylist(playlist);
        this.currentPlaylist = playlist;
        this.currentSongIndex = 0;
        await this.loadCurrentSong();
        await this.play();
      }
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
    if (!this.currentPlaylist || !this.currentPlaylist.songs.length) {
      console.warn('No playlist or songs available');
      return;
    }

    const currentSong = this.currentPlaylist.songs[this.currentSongIndex];
    try {
      console.log('Loading song:', currentSong.name);
      
      // Şarkı ID'sini URL'den çıkar
      const songId = currentSong.filePath.replace('indexeddb://', '');
      const songBlob = await playlistDownloadService.getSong(songId);

      if (songBlob) {
        const url = URL.createObjectURL(new Blob([songBlob]));
        this.audio.src = url;
        console.log(`Loaded song from local storage: ${currentSong.name}`);
        
        toast({
          title: "Şarkı Yüklendi",
          description: currentSong.name
        });
      } else {
        throw new Error('Song not found in storage');
      }
    } catch (error) {
      console.error('Error loading song:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `${currentSong.name} yüklenirken bir hata oluştu`
      });
    }
  }

  async play() {
    try {
      await this.audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Şarkı başlatılırken bir hata oluştu"
      });
    }
  }

  pause() {
    this.audio.pause();
    toast({
      title: "Duraklatıldı",
      description: this.getCurrentSong()?.name
    });
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