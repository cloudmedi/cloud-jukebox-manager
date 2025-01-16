const { createLogger } = require('../../utils/logger');
const { Howl } = require('howler');
const logger = createLogger('smart-queue');

class SmartQueueManager {
    constructor() {
        this.queue = [];
        this.currentIndex = -1;
        this.howl = null;
        this.isPlaying = false;
    }

    addToQueue(song) {
        logger.info('Adding song to queue:', song.name);
        this.queue.push(song);
    }

    clearQueue() {
        logger.info('Clearing queue');
        this.queue = [];
        this.currentIndex = -1;
        if (this.howl) {
            this.howl.unload();
            this.howl = null;
        }
    }

    getCurrentSong() {
        return this.currentIndex >= 0 && this.currentIndex < this.queue.length 
            ? this.queue[this.currentIndex] 
            : null;
    }

    async playNext() {
        try {
            if (this.queue.length === 0) {
                logger.info('Queue is empty');
                return null;
            }

            // Sıradaki şarkıya geç
            this.currentIndex = (this.currentIndex + 1) % this.queue.length;
            const nextSong = this.queue[this.currentIndex];

            if (!nextSong) {
                logger.error('No next song available');
                return null;
            }

            // Önceki şarkıyı durdur
            if (this.howl) {
                this.howl.unload();
            }

            // Yeni şarkıyı yükle
            this.howl = new Howl({
                src: [nextSong.localPath],
                html5: true,
                onend: () => {
                    logger.info('Song ended, playing next');
                    this.playNext();
                },
                onplay: () => {
                    logger.info('Started playing:', nextSong.name);
                    this.isPlaying = true;
                },
                onpause: () => {
                    logger.info('Paused:', nextSong.name);
                    this.isPlaying = false;
                },
                onstop: () => {
                    logger.info('Stopped:', nextSong.name);
                    this.isPlaying = false;
                },
                onloaderror: (id, error) => {
                    logger.error('Error loading audio:', error);
                    this.playNext(); // Hata durumunda sonraki şarkıya geç
                },
                onplayerror: (id, error) => {
                    logger.error('Error playing audio:', error);
                    this.playNext(); // Hata durumunda sonraki şarkıya geç
                }
            });

            // Şarkıyı çal
            this.howl.play();

            return nextSong;
        } catch (error) {
            logger.error('Error in playNext:', error);
            return null;
        }
    }

    async playPrevious() {
        try {
            if (this.queue.length === 0) {
                logger.info('Queue is empty');
                return null;
            }

            // Önceki şarkıya geç
            this.currentIndex = this.currentIndex > 0 
                ? this.currentIndex - 1 
                : this.queue.length - 1;

            const previousSong = this.queue[this.currentIndex];

            if (!previousSong) {
                logger.error('No previous song available');
                return null;
            }

            // Önceki şarkıyı durdur
            if (this.howl) {
                this.howl.unload();
            }

            // Yeni şarkıyı yükle
            this.howl = new Howl({
                src: [previousSong.localPath],
                html5: true,
                onend: () => {
                    logger.info('Song ended, playing next');
                    this.playNext();
                },
                onplay: () => {
                    logger.info('Started playing:', previousSong.name);
                    this.isPlaying = true;
                },
                onpause: () => {
                    logger.info('Paused:', previousSong.name);
                    this.isPlaying = false;
                },
                onstop: () => {
                    logger.info('Stopped:', previousSong.name);
                    this.isPlaying = false;
                },
                onloaderror: (id, error) => {
                    logger.error('Error loading audio:', error);
                    this.playNext(); // Hata durumunda sonraki şarkıya geç
                },
                onplayerror: (id, error) => {
                    logger.error('Error playing audio:', error);
                    this.playNext(); // Hata durumunda sonraki şarkıya geç
                }
            });

            // Şarkıyı çal
            this.howl.play();

            return previousSong;
        } catch (error) {
            logger.error('Error in playPrevious:', error);
            return null;
        }
    }

    pause() {
        if (this.howl && this.isPlaying) {
            this.howl.pause();
        }
    }

    resume() {
        if (this.howl && !this.isPlaying) {
            this.howl.play();
        }
    }

    stop() {
        if (this.howl) {
            this.howl.stop();
            this.howl.unload();
            this.howl = null;
        }
        this.isPlaying = false;
    }

    setVolume(volume) {
        if (this.howl) {
            this.howl.volume(volume);
        }
    }

    getVolume() {
        return this.howl ? this.howl.volume() : 1;
    }
}

module.exports = new SmartQueueManager();
