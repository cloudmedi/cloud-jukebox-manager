const { Howl } = require('howler');
const path = require('path');
const { createLogger } = require('../../utils/logger');
const fs = require('fs');

const logger = createLogger('jukebox-player');

class JukeboxPlayer {
    constructor() {
        this.currentHowl = null;      // Şu an çalan playlist şarkısı
        this.nextHowl = null;         // Sıradaki playlist şarkısı
        this.announcementHowl = null; // Anons/kampanya sesi
        this.scheduleHowl = null;     // Schedule sesi
        this.crossfadeTimer = null;   // Crossfade timer referansı
        this.isCrossfading = false;   // Crossfade durumu
        
        this.isPlaying = false;
        this.currentPlaylist = null;
        this.currentIndex = 0;
        this.volume = 1.0;
        this.fadeTime = 3000;       // Fade süresi (ms)
        this.crossfadeTime = 5;     // Son kaç saniyede crossfade başlasın
        
        // Event handlers
        this.onSongEndCallback = null;
        this.onPlaybackChangeCallback = null;
    }

    // Event listener setters
    setOnSongEndCallback(callback) {
        this.onSongEndCallback = callback;
    }

    setOnPlaybackChangeCallback(callback) {
        this.onPlaybackChangeCallback = callback;
    }

    // Playlist yönetimi
    async loadPlaylist(playlist) {
        try {
            if (!playlist || !playlist.songs || playlist.songs.length === 0) {
                console.error('Invalid playlist:', playlist);
                return false;
            }

            // Önceki playlist'i durdur
            await this.stopPlaylist();

            this.currentPlaylist = playlist;
            this.currentIndex = 0;
            
            // İlk şarkıyı yükle ve çal
            await this.loadAndPlayCurrent();
            
            // Sonraki şarkıyı hazırla
            await this.preloadNext();
            
            return true;
        } catch (error) {
            console.error('Error loading playlist:', error);
            return false;
        }
    }

    async loadAndPlayCurrent() {
        const currentSong = this.currentPlaylist.songs[this.currentIndex];
        if (!currentSong?.localPath) {
            logger.error('Invalid song:', currentSong);
            return false;
        }

        logger.info('Loading current song:', currentSong.name, 'Index:', this.currentIndex);

        // Önce önceki timer'ı temizle
        if (this.crossfadeTimer) {
            clearInterval(this.crossfadeTimer);
            this.crossfadeTimer = null;
        }

        return new Promise((resolve) => {
            this.currentHowl = new Howl({
                src: [currentSong.localPath],
                html5: true,
                volume: 0,
                autoplay: false,
                preload: true,
                onend: () => {
                    logger.info('Song ended. Crossfading:', this.isCrossfading);
                    // Sadece doğal bitişte (crossfade olmadan) event gönder
                    if (!this.isCrossfading && this.onSongEndCallback) {
                        logger.info('Song ended naturally, sending event');
                        this.onSongEndCallback();
                    }
                },
                onplay: () => {
                    logger.info('Song started playing:', currentSong.name);
                    if (this.onPlaybackChangeCallback) {
                        this.onPlaybackChangeCallback(true);
                    }
                },
                onload: () => {
                    logger.info('Song loaded, starting playback and setting up timer');
                    this.fadeIn(this.currentHowl).then(() => {
                        this.isPlaying = true;
                        this.isCrossfading = false;
                        
                        // Şarkı yüklendiğinde ve çalmaya başladığında timer'ı kur
                        setTimeout(() => {
                            logger.info('Setting up crossfade timer after delay');
                            this.setupCrossfadeTimer();
                        }, 1000); // 1 saniye bekle

                        resolve(true);
                    });
                },
                onloaderror: (id, error) => {
                    logger.error('Error loading song:', error);
                    resolve(false);
                }
            });

            this.currentHowl.load();
        });
    }

    async preloadNext() {
        if (!this.currentPlaylist || !this.currentPlaylist.songs) {
            logger.warn('No playlist available for preload');
            return false;
        }

        const nextIndex = (this.currentIndex + 1) % this.currentPlaylist.songs.length;
        const nextSong = this.currentPlaylist.songs[nextIndex];
        
        logger.info('Preloading next song. Current index:', this.currentIndex, 'Next index:', nextIndex);
        
        if (!nextSong?.localPath) {
            logger.warn('No valid next song to preload');
            return false;
        }

        // Dosyanın var olup olmadığını kontrol et
        try {
            const exists = fs.existsSync(nextSong.localPath);
            
            if (!exists) {
                logger.warn('Next song file not found, waiting for download:', nextSong.localPath);
                // 10 saniye boyunca her 500ms'de bir kontrol et
                for (let i = 0; i < 20; i++) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    if (fs.existsSync(nextSong.localPath)) {
                        logger.info('Next song file is now available');
                        break;
                    }
                }
                
                // Son bir kontrol
                if (!fs.existsSync(nextSong.localPath)) {
                    logger.error('Next song file still not available after waiting');
                    return false;
                }
            }

            // Önceki nextHowl'ı temizle
            if (this.nextHowl) {
                this.nextHowl.unload();
                this.nextHowl = null;
            }

            return new Promise((resolve) => {
                this.nextHowl = new Howl({
                    src: [nextSong.localPath],
                    html5: true,
                    volume: 0,
                    preload: true,
                    onload: () => {
                        logger.info('Next song loaded successfully:', nextSong.name);
                        resolve(true);
                    },
                    onloaderror: (id, error) => {
                        logger.error('Error loading next song:', error);
                        resolve(false);
                    }
                });
                logger.info('Started preloading next song:', nextSong.name);
            });
        } catch (error) {
            logger.error('Error checking/loading next song:', error);
            return false;
        }
    }

    setupCrossfadeTimer() {
        // Önce eski timer'ı temizle
        if (this.crossfadeTimer) {
            clearInterval(this.crossfadeTimer);
            this.crossfadeTimer = null;
        }

        if (!this.currentHowl) {
            logger.warn('Cannot setup timer - no current howl');
            return;
        }

        const duration = this.currentHowl.duration();
        if (!duration) {
            logger.warn('Cannot setup timer - no duration:', duration);
            return;
        }

        logger.info('Setting up crossfade timer. Duration:', duration, 'Crossfade at:', this.crossfadeTime);
        
        // Timer'ı class property olarak sakla
        this.crossfadeTimer = setInterval(() => {
            try {
                if (!this.currentHowl || !this.isPlaying) {
                    logger.warn('Clearing timer - howl or playing state invalid');
                    clearInterval(this.crossfadeTimer);
                    this.crossfadeTimer = null;
                    return;
                }

                const currentTime = this.currentHowl.seek();
                if (currentTime === null) {
                    logger.warn('Current time is null, skipping check');
                    return;
                }

                const remainingTime = duration - currentTime;
                logger.info('Timer check - Current time:', currentTime, 'Remaining:', remainingTime);
                
                // Son crossfadeTime saniyeye geldik mi?
                if (remainingTime <= this.crossfadeTime) {
                    logger.info(`Triggering crossfade with ${remainingTime}s remaining`);
                    this.startCrossfade();
                    clearInterval(this.crossfadeTimer);
                    this.crossfadeTimer = null;
                }
            } catch (error) {
                logger.error('Error in timer:', error);
            }
        }, 100); // Her 100ms'de kontrol et

        logger.info(`Crossfade timer setup complete - will trigger with ${this.crossfadeTime}s remaining`);
    }

    async startCrossfade() {
        logger.info('Starting crossfade...');
        
        // Crossfade durumunu işaretle
        this.isCrossfading = true;

        // nextHowl yoksa preload dene ve bekle
        if (!this.nextHowl) {
            logger.info('No next song preloaded, trying to load...');
            const preloadResult = await this.preloadNext();
            
            // Preload başarısız olduysa
            if (!preloadResult || !this.nextHowl) {
                logger.error('Could not load next song for crossfade');
                this.isCrossfading = false;
                // Şimdiki şarkıyı bitir ve bir sonrakine geç
                if (this.currentHowl) {
                    this.currentHowl.stop();
                }
                this.playNext();
                return;
            }
        }
        
        try {
            // İki şarkıyı aynı anda fade
            await Promise.all([
                this.fadeOut(this.currentHowl),
                this.fadeIn(this.nextHowl)
            ]);
            
            // Rolleri değiştir
            if (this.currentHowl) {
                this.currentHowl.unload();
            }
            this.currentHowl = this.nextHowl;
            this.nextHowl = null;
            
            // Sıradaki şarkı indexini güncelle
            this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist.songs.length;
            
            // Bir sonraki şarkıyı yüklemeye başla
            this.preloadNext().catch(error => {
                logger.error('Error preloading next song after crossfade:', error);
            });

            // Yeni şarkı için timer'ı kur
            logger.info('Setting up timer for new song after crossfade');
            setTimeout(() => {
                this.isCrossfading = false;
                this.setupCrossfadeTimer();
            }, 1000);
        } catch (error) {
            logger.error('Error during crossfade:', error);
            this.isCrossfading = false;
            // Hata durumunda bir sonraki şarkıya geç
            this.playNext();
        }
    }

    playNext() {
        if (!this.currentPlaylist || !this.currentPlaylist.songs) {
            logger.warn('No playlist available for playNext');
            return;
        }

        // Önce mevcut şarkıyı durdur
        if (this.currentHowl) {
            this.currentHowl.stop();
            this.currentHowl.unload();
            this.currentHowl = null;
        }

        // Sonraki şarkıya geç
        this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist.songs.length;
        const nextSong = this.currentPlaylist.songs[this.currentIndex];
        
        if (nextSong && nextSong.status === 'completed') {
            logger.info('Playing next song:', nextSong.name);
            this.loadAndPlayCurrent();
        } else {
            // Sonraki completed şarkıyı bul
            const nextCompletedIndex = this.currentPlaylist.songs.findIndex((song, index) => 
                index > this.currentIndex && song.status === 'completed'
            );

            if (nextCompletedIndex !== -1) {
                this.currentIndex = nextCompletedIndex;
                logger.info('Skipping to next completed song:', this.currentPlaylist.songs[this.currentIndex].name);
                this.loadAndPlayCurrent();
            } else {
                // Baştan başla
                this.currentIndex = 0;
                const firstCompletedSong = this.currentPlaylist.songs.find(song => song.status === 'completed');
                if (firstCompletedSong) {
                    logger.info('Restarting playlist from first completed song');
                    this.loadAndPlayCurrent();
                } else {
                    logger.error('No completed songs found in playlist');
                }
            }
        }
    }

    // Anons/Kampanya yönetimi
    async playAnnouncement(audioUrl) {
        try {
            // Önce playlist'i duraklat
            if (this.currentHowl) {
                await this.fadeOut(this.currentHowl);
            }

            // Önceki anonsu temizle
            if (this.announcementHowl) {
                this.announcementHowl.unload();
            }

            // Yeni anonsu yükle ve çal
            this.announcementHowl = new Howl({
                src: [audioUrl],
                html5: true,
                volume: 0,
                onend: () => {
                    // Anons bitince playlist'e geri dön
                    this.announcementHowl = null;
                    if (this.currentHowl) {
                        this.fadeIn(this.currentHowl);
                    }
                }
            });

            await this.fadeIn(this.announcementHowl);
            return true;
        } catch (error) {
            console.error('Error playing announcement:', error);
            return false;
        }
    }

    // Schedule yönetimi
    async playSchedule(audioUrl) {
        try {
            // Önce playlist'i duraklat
            if (this.currentHowl) {
                await this.fadeOut(this.currentHowl);
            }

            // Önceki schedule'ı temizle
            if (this.scheduleHowl) {
                this.scheduleHowl.unload();
            }

            // Yeni schedule'ı yükle ve çal
            this.scheduleHowl = new Howl({
                src: [audioUrl],
                html5: true,
                volume: 0,
                onend: () => {
                    // Schedule bitince playlist'e geri dön
                    this.scheduleHowl = null;
                    if (this.currentHowl) {
                        this.fadeIn(this.currentHowl);
                    }
                }
            });

            await this.fadeIn(this.scheduleHowl);
            return true;
        } catch (error) {
            console.error('Error playing schedule:', error);
            return false;
        }
    }

    async stopSchedule() {
        if (this.scheduleHowl) {
            await this.fadeOut(this.scheduleHowl);
            this.scheduleHowl.unload();
            this.scheduleHowl = null;

            // Playlist'e geri dön
            if (this.currentHowl) {
                await this.fadeIn(this.currentHowl);
            }
        }
    }

    // Playback kontrol
    async stop() {
        await this.stopPlaylist();
        await this.stopAnnouncement();
        await this.stopSchedule();
        this.isPlaying = false;
        if (this.onPlaybackChangeCallback) {
            this.onPlaybackChangeCallback(false);
        }
    }

    async stopPlaylist() {
        if (this.currentHowl) {
            await this.fadeOut(this.currentHowl);
            this.currentHowl.unload();
            this.currentHowl = null;
        }
        if (this.nextHowl) {
            this.nextHowl.unload();
            this.nextHowl = null;
        }
    }

    async stopAnnouncement() {
        if (this.announcementHowl) {
            await this.fadeOut(this.announcementHowl);
            this.announcementHowl.unload();
            this.announcementHowl = null;
        }
    }

    // Fade efektleri
    async fadeOut(howl) {
        return new Promise((resolve) => {
            if (!howl) {
                resolve();
                return;
            }

            const fadeInterval = 50;
            const steps = this.fadeTime / fadeInterval;
            const volumeStep = howl.volume() / steps;
            
            let currentStep = 0;
            
            const fadeTimer = setInterval(() => {
                currentStep++;
                const newVolume = howl.volume() - volumeStep;
                
                if (currentStep >= steps || newVolume <= 0) {
                    clearInterval(fadeTimer);
                    howl.volume(0);
                    resolve();
                } else {
                    howl.volume(newVolume);
                }
            }, fadeInterval);
        });
    }

    async fadeIn(howl) {
        return new Promise((resolve) => {
            if (!howl) {
                resolve();
                return;
            }

            howl.volume(0);
            howl.play();

            const fadeInterval = 50;
            const steps = this.fadeTime / fadeInterval;
            const volumeStep = this.volume / steps;
            
            let currentStep = 0;
            
            const fadeTimer = setInterval(() => {
                currentStep++;
                const newVolume = howl.volume() + volumeStep;
                
                if (currentStep >= steps || newVolume >= this.volume) {
                    clearInterval(fadeTimer);
                    howl.volume(this.volume);
                    resolve();
                } else {
                    howl.volume(newVolume);
                }
            }, fadeInterval);
        });
    }

    pause() {
        if (this.currentHowl && this.isPlaying) {
            this.fadeOut(this.currentHowl).then(() => {
                this.currentHowl.pause();
                this.isPlaying = false;
                if (this.onPlaybackChangeCallback) {
                    this.onPlaybackChangeCallback(false);
                }
            });
        }
    }

    async resume() {
        if (this.currentHowl && !this.isPlaying) {
            await this.fadeIn(this.currentHowl);
            this.isPlaying = true;
            this.setupCrossfadeTimer();
            if (this.onPlaybackChangeCallback) {
                this.onPlaybackChangeCallback(true);
            }
        }
    }

    // Test için seek metodu
    seekToEnd() {
        if (this.currentHowl) {
            const duration = this.currentHowl.duration();
            if (duration) {
                logger.info('Current duration:', duration);
                // Son 6 saniyeye git (crossfade 5 saniyede başlıyor)
                this.currentHowl.seek(duration - 6);
                logger.info('Seeked to end of song, current time:', this.currentHowl.seek());
            } else {
                logger.warn('No duration available for seek');
            }
        } else {
            logger.warn('No current howl for seek');
        }
    }

    // Yardımcı fonksiyonlar
    setVolume(value) {
        this.volume = value;
        if (this.currentHowl) {
            this.currentHowl.volume(value);
        }
    }

    isAnnouncementPlaying() {
        return this.announcementHowl !== null;
    }

    isSchedulePlaying() {
        return this.scheduleHowl !== null;
    }

    getCurrentSong() {
        return this.currentPlaylist?.songs[this.currentIndex];
    }
}

module.exports = JukeboxPlayer;
