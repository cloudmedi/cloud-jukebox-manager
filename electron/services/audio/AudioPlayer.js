const { Howl } = require('howler');
const path = require('path');
const { createLogger } = require('../../utils/logger');
const QueueManager = require('./QueueManager');
const DownloadStateManager = require('../download/DownloadStateManager');

const logger = createLogger('audio-player');

class AudioPlayer {
  constructor() {
    this.sound = null;
    this.volume = 1.0;
    this.queueManager = new QueueManager();
    this.downloadStateManager = DownloadStateManager;
    this.isLoading = false;
  }

  loadPlaylist(playlist) {
    if (!playlist || !playlist.songs) return;

    // Mevcut çalan şarkıyı al
    const currentlyPlaying = this.downloadStateManager.getCurrentlyPlaying();

    // Queue'yu güncelle ama çalan şarkıyı durdurma
    this.queueManager.setQueue(playlist.songs);

    // Eğer şarkı çalmıyorsa ve hazır şarkı varsa başlat
    if (!currentlyPlaying) {
      const readySong = playlist.songs.find(song => 
        song.status === 'completed' && song.localPath
      );
      
      if (readySong) {
        this.loadAndPlaySong(readySong);
      }
    }
  }

  loadAndPlaySong(song) {
    if (!song || !song.localPath || this.isLoading) return;

    this.isLoading = true;
    logger.info(`Loading song: ${song.name}`);

    // Önceki şarkıyı temizle
    if (this.sound) {
      this.sound.unload();
    }

    try {
      // Yeni şarkıyı yükle
      this.sound = new Howl({
        src: [song.localPath],
        html5: true,
        volume: this.volume,
        format: ['mp3'],
        onplay: async () => {
          logger.info(`Started playing: ${song.name}`);
          
          // Önceki çalan şarkıyı kontrol et
          const previousPlaying = this.downloadStateManager.getCurrentlyPlaying();
          const activePlaylistId = this.downloadStateManager.store.get('activePlaylistId');
          
          // Eğer önceki şarkı varsa ve farklı bir playlist'ten ise temizle
          if (previousPlaying && previousPlaying.playlistId !== activePlaylistId) {
            logger.info(`Cleaning up previous song from different playlist: ${previousPlaying.name}`);
            await this.downloadStateManager.clearPlaylistState(previousPlaying.playlistId);
          }
          
          // Yeni şarkıyı aktif olarak işaretle
          this.downloadStateManager.setCurrentlyPlaying({
            ...song,
            playlistId: activePlaylistId
          });
          
          this.isLoading = false;
        },
        onend: () => {
          logger.info(`Song ended: ${song.name}`);
          this.downloadStateManager.clearCurrentlyPlaying();
          this.playNext();
        },
        onloaderror: (id, error) => {
          logger.error(`Error loading song: ${song.name}`, error);
          this.isLoading = false;
          this.downloadStateManager.clearCurrentlyPlaying();
          this.playNext();
        },
        onplayerror: (id, error) => {
          logger.error(`Error playing song: ${song.name}`, error);
          this.isLoading = false;
          this.downloadStateManager.clearCurrentlyPlaying();
          this.playNext();
        }
      });

      this.sound.play();
    } catch (error) {
      logger.error(`Error initializing song: ${song.name}`, error);
      this.isLoading = false;
      this.downloadStateManager.clearCurrentlyPlaying();
      this.playNext();
    }
  }

  playNext() {
    logger.info('Playing next song');
    const nextSong = this.queueManager.next();
    
    // Önce aktif playlist'ten hazır olan şarkıyı bul
    const activePlaylistId = this.downloadStateManager.store.get('activePlaylistId');
    if (activePlaylistId) {
      const activePlaylist = this.downloadStateManager.store.get(`playlists.${activePlaylistId}`);
      if (activePlaylist) {
        const readySong = activePlaylist.songs.find(song => 
          song.status === 'completed' && song.localPath
        );
        
        if (readySong) {
          this.loadAndPlaySong(readySong);
          return;
        }
      }
    }

    // Aktif playlist'te hazır şarkı yoksa queue'dan devam et
    if (nextSong && nextSong.localPath) {
      this.loadAndPlaySong(nextSong);
    }
  }

  pause() {
    if (this.sound) {
      this.sound.pause();
    }
  }

  resume() {
    if (this.sound) {
      this.sound.play();
    }
  }

  stop() {
    if (this.sound) {
      this.sound.stop();
      this.sound.unload();
      this.sound = null;
    }
    this.downloadStateManager.clearCurrentlyPlaying();
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.sound) {
      this.sound.volume(volume);
    }
  }

  getCurrentTime() {
    return this.sound ? this.sound.seek() : 0;
  }

  getDuration() {
    return this.sound ? this.sound.duration() : 0;
  }

  seek(position) {
    if (this.sound) {
      this.sound.seek(position);
    }
  }
}

module.exports = new AudioPlayer();