const { ipcRenderer } = require('electron');
const { createLogger } = require('../../utils/logger');
const jukeboxPlayer = require('../audio/JukeboxPlayer');
const store = require('electron-store');

const logger = createLogger('playlist-controller');
const storage = new store();

class PlaylistController {
    constructor() {
        this.currentPlaylist = null;
        this.storage = storage;
        this.initialize();
    }

    async initialize() {
        try {
            // Başlangıç playlist'ini yükle
            const savedPlaylists = storage.get('playlists', {});
            if (Object.keys(savedPlaylists).length > 0) {
                const latestPlaylistId = Object.keys(savedPlaylists)[Object.keys(savedPlaylists).length - 1];
                const latestPlaylist = savedPlaylists[latestPlaylistId];
                await this.loadPlaylist(latestPlaylist);
            }
        } catch (error) {
            logger.error('Error initializing playlist:', error);
        }
    }

    async loadPlaylist(playlist) {
        try {
            if (!playlist?.songs?.length) {
                logger.warn('No songs in playlist');
                return false;
            }

            logger.info('Loading playlist:', { id: playlist.id });

            // Playlist'i storage'a kaydet
            const playlists = this.storage.get('playlists', {});
            playlists[playlist.id] = playlist;
            this.storage.set('playlists', playlists);

            // JukeboxPlayer'a gönder
            jukeboxPlayer.loadPlaylist(playlist);

            // UI'ı güncelle
            this.updateUI(playlist);

            // Eğer başka bir şey çalmıyorsa playlist'i başlat
            if (!jukeboxPlayer.isPlaying()) {
                const firstSong = playlist.songs[0];
                await jukeboxPlayer.play(firstSong, 'playlist');
            }

            this.currentPlaylist = playlist;

            return true;
        } catch (error) {
            logger.error('Error loading playlist:', error);
            return false;
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
