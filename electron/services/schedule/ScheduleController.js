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
        
        // Audio elementlerinin başlangıç ayarları
        if (this.audioPlayer) {
            this.audioPlayer.playbackRate = 1.0;
            this.audioPlayer.volume = 1.0;
        }
        if (this.playlistAudio) {
            this.playlistAudio.playbackRate = 1.0;
            this.playlistAudio.volume = 1.0;
        }

        this.errorCount = 0;
        this.maxErrors = 3;
        this.checkInterval = 10000; // 10 saniye
        this.scheduleCheckTimer = null;
        this.initialize();
    }

    async initialize() {
        if (this.audioPlayer) {
            // Şarkı bittiğinde sonraki şarkıya geç
            this.audioPlayer.addEventListener('ended', () => {
                this.errorCount = 0;
                this.playNextSong();
            });

            // Hata durumunda sonraki şarkıya geç
            this.audioPlayer.addEventListener('error', (e) => {
                this.handlePlaybackError(e);
            });
        }

        // Başlangıç kontrolü
        await this.checkCurrentSchedule();
        
        // Periyodik kontrol başlat
        this.scheduleCheckTimer = setInterval(() => this.checkCurrentSchedule(), this.checkInterval);
    }

    async checkCurrentSchedule() {
        try {
            // Backend'den aktif schedule'ı al
            const response = await ipcRenderer.invoke('get-active-schedule');
            const activeSchedule = response.schedule;

            logger.info('Checking current schedule:', { 
                hasActiveSchedule: !!activeSchedule,
                currentSchedule: this.currentSchedule ? this.currentSchedule.id : null
            });

            if (!activeSchedule && this.currentSchedule) {
                // Schedule artık aktif değil
                logger.info('Schedule is no longer active:', this.currentSchedule.id);
                await this.fallbackToPlaylist('schedule_ended');
            } 
            else if (activeSchedule && (!this.currentSchedule || this.currentSchedule.id !== activeSchedule.id)) {
                // Yeni veya farklı schedule başlıyor
                await this.startSchedule(activeSchedule);
            }
        } catch (error) {
            logger.error('Schedule check error:', error);
            await this.fallbackToPlaylist('check_error');
        }
    }

    handlePlaybackError(error) {
        this.errorCount++;
        logger.error('Schedule player error:', error);
        
        if (this.errorCount >= this.maxErrors) {
            logger.error('Too many consecutive errors, stopping schedule playback');
            this.fallbackToPlaylist('too_many_errors');
            return;
        }
        
        this.playNextSong();
    }

    async startSchedule(schedule) {
        try {
            if (!schedule || !schedule.playlist || !schedule.playlist.songs || schedule.playlist.songs.length === 0) {
                logger.error('Invalid schedule or no songs in schedule');
                await this.fallbackToPlaylist('invalid_schedule');
                return;
            }

            // Süre kontrolü
            const now = new Date();
            const startDate = new Date(schedule.startDate);
            const endDate = new Date(schedule.endDate);
            if (now < startDate || now > endDate) {
                logger.error('Schedule is not active:', {
                    now,
                    startDate,
                    endDate
                });
                await this.fallbackToPlaylist('schedule_not_active');
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
            this.songs = schedule.playlist.songs;
            this.currentSongIndex = 0;
            this.errorCount = 0;

            // Schedule playlist'ini başlat
            await this.playCurrentSong();
            logger.info('Schedule started:', schedule.id);
        } catch (error) {
            logger.error('Error starting schedule:', error);
            await this.fallbackToPlaylist('start_error');
        }
    }

    async fallbackToPlaylist(reason) {
        logger.info('Falling back to normal playlist:', { reason });
        
        // Schedule'ı temizle
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        this.currentSchedule = null;
        this.songs = [];
        this.currentSongIndex = 0;

        // Normal playlist'e dön
        if (this.playlistAudio) {
            // Ses ve hız ayarlarını sıfırla
            this.playlistAudio.volume = 1.0;
            this.playlistAudio.playbackRate = 1.0;

            try {
                // Eğer playlist duraklatılmışsa veya bitmiş durumdaysa baştan başlat
                if (this.playlistAudio.paused || this.playlistAudio.ended) {
                    this.playlistAudio.currentTime = 0;
                }
                
                // Direk başlat
                await this.playlistAudio.play();
                logger.info('Started normal playlist playback', {
                    currentTime: this.playlistAudio.currentTime,
                    playbackRate: this.playlistAudio.playbackRate,
                    volume: this.playlistAudio.volume
                });
            } catch (error) {
                logger.error('Error starting playlist:', error);
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
                // Eğer aynı şarkı çalıyorsa, tekrar başlatma
                if (this.audioPlayer.src === currentSong.url || 
                    this.audioPlayer.src === `file://${currentSong.url}`) {
                    logger.info('Song already playing, skipping restart');
                    return;
                }

                logger.info('Playing song:', {
                    songId: currentSong.id,
                    songName: currentSong.name,
                    songUrl: currentSong.url
                });

                // URL'yi doğru formatta ayarla
                const songUrl = currentSong.url.startsWith('file://') ? 
                    currentSong.url : 
                    `file://${currentSong.url}`;

                this.audioPlayer.src = songUrl;
                await this.audioPlayer.play();
                this.errorCount = 0;
                logger.info(`Playing schedule song: ${currentSong.id}`);
            }
        } catch (error) {
            logger.error('Error playing song:', {
                error: error.message,
                songIndex: this.currentSongIndex,
                songInfo: this.songs[this.currentSongIndex]
            });
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

    // Ses geçiş metodları
    async fadeOutPlaylist() {
        if (this.playlistAudio) {
            // Çalma hızını normale getir
            this.playlistAudio.playbackRate = 1.0;

            const fadeInterval = 50;
            const fadeStep = 0.1;
            const originalVolume = this.playlistAudio.volume;

            return new Promise((resolve) => {
                const fade = setInterval(() => {
                    if (this.playlistAudio.volume - fadeStep <= 0) {
                        this.playlistAudio.volume = 0;
                        clearInterval(fade);
                        resolve();
                    } else {
                        this.playlistAudio.volume -= fadeStep;
                    }
                }, fadeInterval);
            });
        }
    }

    async fadeInPlaylist() {
        if (this.playlistAudio) {
            // Çalma hızını normale getir
            this.playlistAudio.playbackRate = 1.0;

            const fadeInterval = 50;
            const fadeStep = 0.1;
            const targetVolume = 1.0;
            this.playlistAudio.volume = 0;

            return new Promise((resolve) => {
                const fade = setInterval(() => {
                    if (this.playlistAudio.volume + fadeStep >= targetVolume) {
                        this.playlistAudio.volume = targetVolume;
                        clearInterval(fade);
                        resolve();
                    } else {
                        this.playlistAudio.volume += fadeStep;
                    }
                }, fadeInterval);
            });
        }
    }

    async fadeOutSchedule() {
        if (this.audioPlayer) {
            const fadeInterval = 50;
            const fadeStep = 0.1;
            const originalVolume = this.audioPlayer.volume;

            return new Promise((resolve) => {
                const fade = setInterval(() => {
                    if (this.audioPlayer.volume - fadeStep <= 0) {
                        this.audioPlayer.volume = 0;
                        clearInterval(fade);
                        resolve();
                    } else {
                        this.audioPlayer.volume -= fadeStep;
                    }
                }, fadeInterval);
            });
        }
    }

    async fadeInSchedule() {
        if (this.audioPlayer) {
            const fadeInterval = 50;
            const fadeStep = 0.1;
            const targetVolume = 1.0;
            this.audioPlayer.volume = 0;

            return new Promise((resolve) => {
                const fade = setInterval(() => {
                    if (this.audioPlayer.volume + fadeStep >= targetVolume) {
                        this.audioPlayer.volume = targetVolume;
                        clearInterval(fade);
                        resolve();
                    } else {
                        this.audioPlayer.volume += fadeStep;
                    }
                }, fadeInterval);
            });
        }
    }
}

module.exports = ScheduleController;
