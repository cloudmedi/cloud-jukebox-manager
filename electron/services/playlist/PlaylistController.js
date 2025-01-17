const { ipcRenderer } = require('electron');
const { createLogger } = require('../../utils/logger');
const jukeboxPlayer = require('../audio/JukeboxPlayer');
const store = require('electron-store');

const logger = createLogger('playlist-controller');
const storage = new store();

class PlaylistController {
    constructor() {
        this.currentPlaylist = null;
        this.isInitializing = false;
        this.storage = storage;
        this.initialize();
    }

    async initialize() {
        try {
            if (this.isInitializing) {
                logger.warn('PlaylistController already initializing');
                return;
            }
            
            this.isInitializing = true;
            
            // JukeboxPlayer'ı bekle
            await this.waitForJukeboxPlayer();
            
            // Başlangıç playlist'ini yükle
            const savedPlaylists = storage.get('playlists', {});
            if (Object.keys(savedPlaylists).length > 0) {
                const lastPlaylist = Object.values(savedPlaylists)[Object.keys(savedPlaylists).length - 1];
                logger.info('Loading last saved playlist:', lastPlaylist.name);
                await this.loadPlaylist(lastPlaylist);
            }
            
            this.isInitializing = false;
        } catch (error) {
            this.isInitializing = false;
            logger.error('Error initializing PlaylistController:', error);
        }
    }

    // JukeboxPlayer hazır olana kadar bekle
    async waitForJukeboxPlayer() {
        return new Promise(resolve => {
            const check = () => {
                if (global.jukeboxPlayer && typeof global.jukeboxPlayer.loadPlaylist === 'function') {
                    logger.info('JukeboxPlayer is ready');
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    async loadPlaylist(playlist) {
        try {
            if (!playlist?.songs?.length) {
                logger.warn('Invalid playlist or empty songs list');
                return;
            }

            if (global.jukeboxPlayer.isPlaying()) {
                logger.warn('Player already active, stopping current playback');
                global.jukeboxPlayer.cleanup();
            }

            logger.info('Loading playlist:', playlist.name);
            await global.jukeboxPlayer.loadPlaylist(playlist);
            
            // UI'ı güncelle
            if (global.mainWindow) {
                global.mainWindow.webContents.send('playlist-loaded', playlist);
            }
        } catch (error) {
            logger.error('Error loading playlist:', error);
        }
    }

    updateUI(playlist) {
        try {
            const mainWindow = global.mainWindow;
            if (!mainWindow) return;

            mainWindow.webContents.send('playlist-loaded', playlist);

        } catch (error) {
            logger.error('Error updating UI:', error);
        }
    }

    getCurrentPlaylist() {
        return this.currentPlaylist;
    }

    async play() {
        if (!this.currentPlaylist) return false;
        return await jukeboxPlayer.play(this.currentPlaylist.songs[0], 'playlist');
    }

    pause() {
        jukeboxPlayer.pause();
    }

    setVolume(volume) {
        jukeboxPlayer.setVolume(volume);
    }
}

module.exports = new PlaylistController();
