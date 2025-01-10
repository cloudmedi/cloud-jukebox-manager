const Store = require('electron-store');
const SmartQueueManager = require('../audio/SmartQueueManager');
const winston = require('winston');

// Logger konfigürasyonu
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
});

class PlaylistInitializer {
    constructor() {
        this.store = new Store();
        this.queueManager = SmartQueueManager;
    }

    async initializePlaylist(playlist) {
        if (!playlist || !playlist.songs || playlist.songs.length === 0) {
            logger.warn('No playlist or empty playlist provided');
            return null;
        }

        try {
            // SmartQueueManager'ı başlat ve karıştırma yap
            this.queueManager.initializeQueue(playlist.songs);
            logger.info('Playlist initialized with songs:', playlist.songs.length);

            // İlk şarkıyı seç
            const firstSong = this.queueManager.getCurrentSong();
            
            if (firstSong) {
                logger.info('Starting with randomly selected song:', firstSong.name);
                // Playlist'i güncelle ve ilk şarkıyı ayarla
                const updatedPlaylist = {
                    ...playlist,
                    songs: this.queueManager.getQueue()
                };
                
                // Store'u güncelle
                const playlists = this.store.get('playlists', []);
                const existingIndex = playlists.findIndex(p => p._id === playlist._id);
                
                if (existingIndex !== -1) {
                    playlists[existingIndex] = updatedPlaylist;
                } else {
                    playlists.push(updatedPlaylist);
                }
                
                this.store.set('playlists', playlists);
                
                return {
                    playlist: updatedPlaylist,
                    currentSong: firstSong
                };
            }
            
            return null;
        } catch (error) {
            logger.error('Error initializing playlist:', error);
            return null;
        }
    }
}

module.exports = new PlaylistInitializer();