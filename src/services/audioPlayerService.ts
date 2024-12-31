import { toast } from "@/hooks/use-toast";

class AudioPlayerService {
  private audio: HTMLAudioElement;
  private currentPlaylist: any = null;
  private currentSongIndex: number = 0;

  constructor() {
    this.audio = new Audio();
    this.setupAudioListeners();
    console.log('AudioPlayerService initialized');
  }

  private setupAudioListeners() {
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      toast({
        variant: "destructive",
        title: "Oynatma Hatası",
        description: "Ses dosyası yüklenirken bir hata oluştu"
      });
    });

    this.audio.addEventListener('loadstart', () => {
      console.log('Audio loading started');
    });

    this.audio.addEventListener('canplay', () => {
      console.log('Audio can play');
    });

    this.audio.addEventListener('playing', () => {
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
        const songBlob = await this.getSongFromIndexedDB(songId);
        if (songBlob) {
          this.audio.src = URL.createObjectURL(songBlob);
          console.log('Loaded song from IndexedDB');
        } else {
          throw new Error('Song not found in IndexedDB');
        }
      } else {
        this.audio.src = `http://localhost:5000/${song.filePath}`;
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

  private async getSongFromIndexedDB(songId: string): Promise<Blob | null> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const songData = await store.get(songId);
      return songData;
    } catch (error) {
      console.error('IndexedDB error:', error);
      return null;
    }
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('playlist_db', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs');
        }
      };
    });
  }

  async play() {
    try {
      console.log('Play requested');
      await this.audio.play();
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
    this.audio.pause();
  }

  setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getCurrentSong() {
    if (!this.currentPlaylist?.songs?.length) return null;
    return this.currentPlaylist.songs[this.currentSongIndex];
  }

  get audio() {
    return this.audio;
  }
}

export const audioPlayerService = new AudioPlayerService();