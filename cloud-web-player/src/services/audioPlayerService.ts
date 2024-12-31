class AudioPlayerService {
  private audio: HTMLAudioElement;
  private currentPlaylist: any = null;
  private currentSongIndex: number = 0;
  private autoPlayRequested: boolean = false;

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
        
        // Otomatik oynatma isteğini işaretle ama hemen oynatma
        this.autoPlayRequested = true;
        
        toast({
          title: "Playlist Hazır",
          description: `${localPlaylist.name} yerel depodan yüklendi. Oynatmak için tıklayın.`
        });
      } else {
        console.log('Loading remote playlist:', playlist.name);
        await playlistDownloadService.storePlaylist(playlist);
        this.currentPlaylist = playlist;
        this.currentSongIndex = 0;
        await this.loadCurrentSong();
        this.autoPlayRequested = true;
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
      
      const songId = currentSong.filePath.replace('indexeddb://', '');
      const songBlob = await playlistDownloadService.getSong(songId);

      if (songBlob) {
        const url = URL.createObjectURL(new Blob([songBlob]));
        this.audio.src = url;
        console.log(`Loaded song from local storage: ${currentSong.name}`);
        
        // Eğer otomatik oynatma isteği varsa ve kullanıcı etkileşimi olmuşsa oynat
        if (this.autoPlayRequested && document.hasFocus()) {
          try {
            await this.play();
          } catch (error) {
            console.log('Autoplay prevented, waiting for user interaction');
          }
        }
        
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
      this.autoPlayRequested = false; // Başarılı oynatmadan sonra isteği sıfırla
    } catch (error) {
      console.error('Error playing audio:', error);
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Oynatma Beklemede",
          description: "Oynatmak için sayfaya tıklayın",
          duration: 5000,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Şarkı başlatılırken bir hata oluştu"
        });
      }
      throw error;
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
    if (this.audio.played.length > 0) { // Sadece daha önce oynatılmışsa otomatik devam et
      await this.play();
    }
  }

  async playPrevious() {
    if (!this.currentPlaylist) return;

    this.currentSongIndex = (this.currentSongIndex - 1 + this.currentPlaylist.songs.length) % this.currentPlaylist.songs.length;
    await this.loadCurrentSong();
    if (this.audio.played.length > 0) { // Sadece daha önce oynatılmışsa otomatik devam et
      await this.play();
    }
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