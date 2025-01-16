const Store = require('electron-store');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playback-state');

const PLAYER_PRIORITY = {
  CAMPAIGN: 3,    // En yüksek öncelik
  SCHEDULE: 2,    // Orta öncelik
  PLAYLIST: 1     // En düşük öncelik
};

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
    this.isPlaying = false;
    this.currentMode = null;
    this.activePlayer = null;
    this.players = {
      campaign: null,
      schedule: null,
      playlist: null
    };
    this.initialize();
  }

  initialize() {
    try {
      const state = this.store.get('playbackState', {
        isPlaying: false,
        currentMode: null,
        activePlayer: null
      });
      
      this.isPlaying = state.isPlaying;
      this.currentMode = state.currentMode;
      this.activePlayer = state.activePlayer;
      
      logger.info('Playback state initialized:', { 
        isPlaying: this.isPlaying, 
        mode: this.currentMode,
        activePlayer: this.activePlayer 
      });
    } catch (error) {
      logger.error('Error initializing playback state:', error);
    }
  }

  registerPlayer(type, player) {
    this.players[type] = player;
    logger.info(`Player registered: ${type}`);
  }

  getActivePlayer() {
    // Öncelik sırasına göre aktif player'ı bul
    if (this.players.campaign?.playing) {
      return { type: 'campaign', player: this.players.campaign };
    }
    if (this.players.schedule?.playing) {
      return { type: 'schedule', player: this.players.schedule };
    }
    if (this.players.playlist?.playing) {
      return { type: 'playlist', player: this.players.playlist };
    }
    
    // Hiçbiri çalmıyorsa en son aktif olan player'ı döndür
    if (this.activePlayer && this.players[this.activePlayer]) {
      return { type: this.activePlayer, player: this.players[this.activePlayer] };
    }

    // Varsayılan olarak normal playlist player'ı döndür
    return { type: 'playlist', player: this.players.playlist };
  }

  async play(type) {
    try {
      if (!this.players[type]) {
        logger.error(`No player registered for type: ${type}`);
        return false;
      }

      // Öncelik kontrolü
      if (this.activePlayer && this.activePlayer !== type) {
        const currentPriority = PLAYER_PRIORITY[this.activePlayer.toUpperCase()];
        const newPriority = PLAYER_PRIORITY[type.toUpperCase()];
        
        // Eğer yeni player'ın önceliği daha düşükse çalıştırma
        if (newPriority < currentPriority) {
          logger.info(`Cannot play ${type}, ${this.activePlayer} has higher priority`);
          return false;
        }
        
        // Yüksek öncelikli player gelirse diğerini durdur
        await this.pause(this.activePlayer);
      }

      // Player'ı başlat
      await this.players[type].play();
      this.activePlayer = type;
      this.isPlaying = true;
      this.currentMode = type;
      
      this.saveState();
      logger.info(`Started playing: ${type}`);
      return true;
    } catch (error) {
      logger.error(`Error playing ${type}:`, error);
      return false;
    }
  }

  async pause(type) {
    try {
      if (!this.players[type]) {
        logger.error(`No player registered for type: ${type}`);
        return false;
      }

      // Sadece aktif player'ı durdur
      if (this.activePlayer === type) {
        await this.players[type].pause();
        this.isPlaying = false;
        this.saveState();
        logger.info(`Paused: ${type}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error pausing ${type}:`, error);
      return false;
    }
  }

  async pauseAll() {
    try {
      for (const [type, player] of Object.entries(this.players)) {
        if (player) {
          await player.pause();
        }
      }
      this.isPlaying = false;
      this.activePlayer = null;
      this.saveState();
      logger.info('All players paused');
      return true;
    } catch (error) {
      logger.error('Error pausing all players:', error);
      return false;
    }
  }

  setPlaybackState(isPlaying, mode = null) {
    try {
      this.isPlaying = isPlaying;
      if (mode) {
        this.currentMode = mode;
        this.activePlayer = mode;
      }
      
      // Aktif player'ı bul ve durumunu güncelle
      const { type, player } = this.getActivePlayer();
      if (player) {
        if (isPlaying) {
          player.play().catch(err => logger.error('Error playing:', err));
        } else {
          player.pause();
        }
      }
      
      this.saveState();
      logger.info('Playback state updated:', { 
        isPlaying: this.isPlaying, 
        mode: this.currentMode,
        activePlayer: type 
      });
      
      return true;
    } catch (error) {
      logger.error('Error setting playback state:', error);
      return false;
    }
  }

  saveState() {
    try {
      this.store.set('playbackState', {
        isPlaying: this.isPlaying,
        currentMode: this.currentMode,
        activePlayer: this.activePlayer
      });
    } catch (error) {
      logger.error('Error saving playback state:', error);
    }
  }

  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentMode: this.currentMode,
      activePlayer: this.activePlayer
    };
  }

  canStartPlaylist() {
    // Schedule çalıyorsa playlist başlatılamaz
    return this.currentMode !== 'schedule';
  }

  canStartSchedule() {
    // Her zaman schedule başlatılabilir (öncelikli)
    return true;
  }

  reset() {
    try {
      this.isPlaying = false;
      this.currentMode = null;
      this.activePlayer = null;
      this.saveState();
      logger.info('Playback state reset');
      return true;
    } catch (error) {
      logger.error('Error resetting playback state:', error);
      return false;
    }
  }
}

// Singleton instance
const playbackStateManager = new PlaybackStateManager();
module.exports = playbackStateManager;