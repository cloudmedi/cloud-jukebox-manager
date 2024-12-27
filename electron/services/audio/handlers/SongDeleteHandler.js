const { createLogger } = require('../../../utils/logger');
const PlaylistStoreManager = require('../../store/PlaylistStoreManager');

const logger = createLogger('audio-song-delete-handler');

class AudioSongDeleteHandler {
  constructor(audioService) {
    this.audioService = audioService;
  }

  handle(songId) {
    logger.info(`Handling song deletion in AudioService: ${songId}`);

    // Çalan şarkı kontrolü
    if (this.audioService.currentSound && 
        this.audioService.queue[this.audioService.currentIndex]?._id === songId) {
      logger.info('Currently playing song was deleted, switching to next song');
      this.audioService.handleNextSong();
    }
    
    // Queue güncelleme
    const originalQueueLength = this.audioService.queue.length;
    this.audioService.queue = this.audioService.queue.filter(song => song._id !== songId);
    
    if (this.audioService.queue.length !== originalQueueLength) {
      logger.info(`Removed song ${songId} from queue`);
    }
    
    // Playlist güncelleme
    if (this.audioService.playlist) {
      const originalLength = this.audioService.playlist.songs.length;
      this.audioService.playlist.songs = this.audioService.playlist.songs.filter(
        song => song._id !== songId
      );
      
      if (this.audioService.playlist.songs.length !== originalLength) {
        logger.info(`Removed song ${songId} from current playlist`);
        
        // Store'u güncelle
        PlaylistStoreManager.validatePlaylistData();
      }
    }

    logger.info(`Song deletion handling completed for: ${songId}`);
  }
}

module.exports = AudioSongDeleteHandler;