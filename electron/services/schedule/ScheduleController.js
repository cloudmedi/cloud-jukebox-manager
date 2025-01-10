const { ipcRenderer } = require('electron');
const winston = require('winston');

// Logger konfigürasyonu
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console()
    ]
});

class ScheduleController {
    constructor() {
        this.audioPlayer = document.getElementById('schedulePlayer');
        this.currentSchedule = null;
        this.currentSongIndex = 0;
        this.songs = [];
        this.wasPlaylistPlaying = false;
        this.playlistAudio = document.getElementById('audioPlayer');
        this.errorCount = 0;
        this.maxErrors = 3;
        this.initialize();
    }

    initialize() {
        if (this.audioPlayer) {
            // Şarkı bittiğinde sonraki şarkıya geç
            this.audioPlayer.addEventListener('ended', () => {
                this.errorCount = 0; // Başarılı çalma durumunda hata sayacını sıfırla
                this.playNextSong();
            });

            // Hata durumunda sonraki şarkıya geç
            this.audioPlayer.addEventListener('error', (e) => {
                this.handlePlaybackError(e);
            });
        }

        // Schedule event'lerini dinle
        ipcRenderer.on('schedule-started', (event, data) => {
            this.startSchedule(data);
        });

        ipcRenderer.on('schedule-stopped', (event, scheduleId) => {
            this.stopSchedule(scheduleId);
        });
    }

    handlePlaybackError(error) {
        this.errorCount++;
        logger.error('Schedule player error:', error);
        
        if (this.errorCount >= this.maxErrors) {
            logger.error('Too many consecutive errors, stopping schedule playback');
            this.stopPlayback();
            return;
        }
        
        this.playNextSong();
    }

    async startSchedule(schedule) {
        try {
            if (!schedule || !schedule.songs || schedule.songs.length === 0) {
                logger.error('Invalid schedule or no songs in schedule');
                return;
            }

            logger.info(`Starting to play schedule: ${schedule.id}`);
            
            // Playlist durumunu kaydet ve durdur
            if (this.playlistAudio) {
                this.wasPlaylistPlaying = !this.playlistAudio.paused;
                if (this.wasPlaylistPlaying) {
                    logger.info('Pausing playlist for schedule');
                    this.playlistAudio.pause();
                }
            }

            this.currentSchedule = schedule;
            this.songs = schedule.songs;
            this.currentSongIndex = 0;
            this.errorCount = 0; // Yeni schedule başlarken hata sayacını sıfırla

            // İlk şarkıyı çal
            await this.playCurrentSong();
            logger.info('Schedule started:', schedule.id);
        } catch (error) {
            logger.error('Error starting schedule:', error);
        }
    }

    stopSchedule(scheduleId) {
        if (this.currentSchedule && this.currentSchedule.id === scheduleId) {
            logger.info(`Stopping schedule: ${scheduleId}`);
            this.stopPlayback();

            // Schedule bittiyse ve playlist çalıyorduysa devam ettir
            if (this.wasPlaylistPlaying && this.playlistAudio) {
                logger.info('Resuming playlist after schedule');
                this.playlistAudio.play().catch(err => {
                    logger.error('Error resuming playlist:', err);
                });
            }
        }
    }

    async playCurrentSong() {
        if (!this.songs || !this.songs[this.currentSongIndex]) {
            logger.error('No song to play');
            return;
        }

        try {
            const currentSong = this.songs[this.currentSongIndex];
            if (this.audioPlayer) {
                this.audioPlayer.src = currentSong.url;
                await this.audioPlayer.play();
                this.errorCount = 0; // Başarılı çalma durumunda hata sayacını sıfırla
                logger.info(`Playing schedule song: ${currentSong.id}`);
            }
        } catch (error) {
            this.handlePlaybackError(error);
        }
    }

    async playNextSong() {
        if (!this.songs || this.songs.length === 0) {
            logger.info('No songs in schedule');
            return;
        }

        this.currentSongIndex++;
        if (this.currentSongIndex >= this.songs.length) {
            this.currentSongIndex = 0;
        }

        await this.playCurrentSong();
    }

    stopPlayback() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.src = '';
        }
        this.currentSchedule = null;
        this.songs = [];
        this.currentSongIndex = 0;
        this.errorCount = 0;
    }

    setVolume(volume) {
        if (this.audioPlayer) {
            this.audioPlayer.volume = volume;
        }
    }

    getCurrentSchedule() {
        return this.currentSchedule;
    }
}

module.exports = ScheduleController;
