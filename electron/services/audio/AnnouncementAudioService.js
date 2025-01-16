const { Howl } = require('howler');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('announcement-service');

class AnnouncementAudioService {
    constructor() {
        this.howl = null;
    }

    playAnnouncement(filePath) {
        try {
            // Önceki anons varsa durdur
            if (this.howl) {
                this.howl.unload();
            }

            // Yeni anons oluştur
            this.howl = new Howl({
                src: [filePath],
                html5: true,
                onend: () => {
                    logger.info('Announcement finished');
                    this.howl.unload();
                },
                onloaderror: () => {
                    logger.error('Error loading announcement');
                    this.howl.unload();
                },
                onplayerror: () => {
                    logger.error('Error playing announcement');
                    this.howl.unload();
                }
            });

            // Anonsu çal
            this.howl.play();

        } catch (error) {
            logger.error('Error in playAnnouncement:', error);
        }
    }

    stop() {
        if (this.howl) {
            this.howl.unload();
        }
    }
}

module.exports = new AnnouncementAudioService();