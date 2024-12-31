import { toast } from "@/hooks/use-toast";
import { playlistDownloadService } from "./playlistDownloadService";

class AudioPlayerService {
  private audioElement: HTMLAudioElement;
  private currentPlaylist: any = null;
  private currentSongIndex: number = 0;

  constructor() {
    console.log('AudioPlayerService: Initializing...');
    this.audioElement = new Audio();
    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    console.log('AudioPlayerService: Setting up audio listeners');
    
    this.audioElement.addEventListener('loadstart', () => {
      console.log('Audio Event: loadstart - Started loading audio');
    });

    this.audioElement.addEventListener('canplay', () => {
      console.log('Audio Event: canplay - Audio can start playing');
    });

    this.audioElement.addEventListener('playing', () => {
      console.log('Audio Event: playing - Audio playback started');
      const currentSong = this.getCurrentSong();
      console.log('Current song playing:', currentSong);
    });

    this.audioElement.addEventListener('pause', () => {
      console.log('Audio Event: pause - Audio playback paused');
    });

    this.audioElement.addEventListener('ended', () => {
      console.log('Audio Event: ended - Audio playback ended');
      this.playNext();
    });

    this.audioElement.addEventListener('error', (error) => {
      console.error('Audio Event: error - Playback error:', error);
      console.error('Audio error details:', {
        error: this.audioElement.error,
        networkState: this.audioElement.networkState,
        readyState: this.audioElement.readyState
      });
      
      toast({
        variant: "destructive",
        title: "Oynatma Hatası",
        description: "Şarkı oynatılırken bir hata oluştu."
      });
    });
  }

  async loadPlaylist(playlist: any) {
    try {
      console.log('AudioPlayerService: Loading playlist:', {
        playlistId: playlist._id,
        playlistName: playlist.name,
        songCount: playlist.songs?.length
      });
      
      const localPlaylist = await playlistDownloadService.getPlaylist(playlist._id);
      
      if (localPlaylist) {
        console.log('AudioPlayerService: Found local playlist:', {
          playlistId: localPlaylist._id,
          songCount: localPlaylist.songs?.length
        });
        
        this.currentPlaylist = localPlaylist;
        this.currentSongIndex = 0;
        await this.loadCurrentSong();
      } else {
        console.log('AudioPlayerService: No local playlist found, storing new playlist');
        await playlistDownloadService.storePlaylist(playlist);
        this.currentPlaylist = playlist;
        this.currentSongIndex = 0;
        await this.loadCurrentSong();
      }
    } catch (error) {
      console.error('AudioPlayerService: Error loading playlist:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Playlist yüklenirken bir hata oluştu"
      });
    }
  }

  private async loadCurrentSong() {
    if (!this.currentPlaylist?.songs?.length) {
      console.warn('AudioPlayerService: No songs in playlist');
      return;
    }

    const song = this.currentPlaylist.songs[this.currentSongIndex];
    console.log('AudioPlayerService: Loading song:', {
      songId: song._id,
      songName: song.name,
      filePath: song.filePath
    });

    try {
      if (song.filePath.startsWith('indexeddb://')) {
        const songId = song.filePath.replace('indexeddb://', '');
        console.log('AudioPlayerService: Loading song from IndexedDB:', songId);
        
        const songBlob = await playlistDownloadService.getSong(songId);
        if (songBlob) {
          const url = URL.createObjectURL(new Blob([songBlob]));
          console.log('AudioPlayerService: Created blob URL for song:', url);
          this.audioElement.src = url;
        } else {
          throw new Error('Song not found in IndexedDB');
        }
      } else {
        const url = `http://localhost:5000/${song.filePath}`;
        console.log('AudioPlayerService: Loading song from server:', url);
        this.audioElement.src = url;
      }

      console.log('AudioPlayerService: Audio source set, attempting to play');
      await this.play();
    } catch (error) {
      console.error('AudioPlayerService: Error loading song:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `${song.name} yüklenirken bir hata oluştu`
      });
    }
  }

  async play() {
    try {
      console.log('AudioPlayerService: Attempting to play');
      await this.audioElement.play();
      console.log('AudioPlayerService: Playback started successfully');
    } catch (error) {
      console.error('AudioPlayerService: Play error:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.log('AudioPlayerService: User interaction required');
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
    console.log('AudioPlayerService: Pausing playback');
    this.audioElement.pause();
  }

  async playNext() {
    console.log('AudioPlayerService: Playing next song');
    if (!this.currentPlaylist?.songs?.length) return;
    
    this.currentSongIndex = (this.currentSongIndex + 1) % this.currentPlaylist.songs.length;
    console.log('AudioPlayerService: New song index:', this.currentSongIndex);
    await this.loadCurrentSong();
  }

  async playPrevious() {
    console.log('AudioPlayerService: Playing previous song');
    if (!this.currentPlaylist?.songs?.length) return;
    
    this.currentSongIndex = (this.currentSongIndex - 1 + this.currentPlaylist.songs.length) % this.currentPlaylist.songs.length;
    console.log('AudioPlayerService: New song index:', this.currentSongIndex);
    await this.loadCurrentSong();
  }

  setVolume(volume: number) {
    console.log('AudioPlayerService: Setting volume:', volume);
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