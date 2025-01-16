const { ipcMain } = require('electron');
const { createLogger } = require('../../utils/logger');
const jukeboxPlayer = require('../audio/JukeboxPlayer');
const scheduleStorage = require('../schedule/ScheduleStorage');

const logger = createLogger('command-handler');

class CommandHandler {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Playback komutları
        ipcMain.handle('playback-command', async (event, data) => {
            try {
                const { action } = data;
                logger.info('Received playback command:', action);

                switch (action) {
                    case 'play':
                        // Manuel pause'u kaldır
                        await scheduleStorage.setManuallyPaused(false);
                        jukeboxPlayer.resume();
                        break;

                    case 'pause':
                        // Manuel pause'u aktif et
                        await scheduleStorage.setManuallyPaused(true);
                        jukeboxPlayer.pause();
                        break;

                    default:
                        logger.warn('Unknown playback command:', action);
                }

                return { success: true };
            } catch (error) {
                logger.error('Error handling playback command:', error);
                return { success: false, error: error.message };
            }
        });

        // Volume kontrolü
        ipcMain.handle('volume-command', async (event, data) => {
            try {
                const { volume } = data;
                jukeboxPlayer.setVolume(volume);
                return { success: true };
            } catch (error) {
                logger.error('Error handling volume command:', error);
                return { success: false, error: error.message };
            }
        });
    }
}

module.exports = new CommandHandler();