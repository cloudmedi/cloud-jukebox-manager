const { Howl } = require('howler');
const path = require('path');
const { createLogger } = require('../../utils/logger');
const fs = require('fs');
const { ipcRenderer } = require('electron');

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
        this.playStartTime = null;    // Şarkı başlangıç zamanı

        // Crossfade konfigürasyonu
        this.crossfadeConfig = {
            minFadeTime: 1800,     // 1.8 saniye (daha güvenli minimum)
            maxFadeTime: 2500,     // 2.5 saniye (yavaş şarkılar için)
            minCrossfadeTime: 4,   // 4 saniye kala (daha güvenli)
            maxCrossfadeTime: 6,   // 6 saniye kala (gerektiğinde)
            defaultFadeTime: 2000, // 2 saniye (optimal orta değer)
            defaultCrossfadeTime: 5 // 5 saniye (güvenli geçiş noktası)
        };

        this.fadeTime = this.crossfadeConfig.defaultFadeTime;
        this.crossfadeTime = this.crossfadeConfig.defaultCrossfadeTime;
        this.timerInterval = 50;    // Timer hassasiyeti (ms)
        
        // Ses analizi için değişkenler
        this.volumeHistory = [];
        this.volumeAnalysisWindow = 10; // Kaç örnek üzerinden analiz yapılacak

        // Event handlers
        this.onSongEndCallback = null;
        this.onPlaybackChangeCallback = null;
        this.onSongChangeCallback = null;  // Yeni callback
    }

    // Websocket mesajı gönderme yardımcı fonksiyonu
    sendPlaybackStatus(completed = false) {
        try {
            const currentSong = this.getCurrentSong();
            if (!currentSong) return;

            const currentTime = this.currentHowl ? this.currentHowl.seek() || 0 : 0;
            const duration = this.currentHowl ? this.currentHowl.duration() || 0 : 0;

            // Gerçek çalma süresini hesapla
            const now = Date.now();
            const playDuration = this.playStartTime ? (now - this.playStartTime) / 1000 : 0;

            // Eğer completed=true ise, süreyi şarkının tam uzunluğu olarak gönder
            const reportedTime = completed ? duration : currentTime;

            ipcRenderer.invoke('send-websocket-message', {
                type: 'playbackStatus',
                data: {
                    isPlaying: this.isPlaying,
                    songId: currentSong._id,
                    currentTime: reportedTime,
                    duration: duration,
                    completed: completed,
                    timestamp: new Date().toISOString(),
                    startedAt: this.playStartTime ? new Date(this.playStartTime).toISOString() : new Date().toISOString(),
                    playDuration: playDuration, // Gerçek çalma süresini ekle
                    songDetails: {
                        name: currentSong.name,
                        artist: currentSong.artist,
                        artwork: currentSong.artwork
                    }
                }
            });
        } catch (error) {
            logger.error('Error sending playback status:', error);
        }
    }

    // Event listener setters
    setOnSongEndCallback(callback) {
        this.onSongEndCallback = callback;
    }

    setOnPlaybackChangeCallback(callback) {
        this.onPlaybackChangeCallback = callback;
    }

    setOnSongChangeCallback(callback) {
        this.onSongChangeCallback = callback;
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
        try {
            if (!this.currentPlaylist || !this.currentPlaylist.songs) {
                logger.warn('No current playlist to play');
                return;
            }

            const currentSong = this.currentPlaylist.songs[this.currentIndex];
            if (!currentSong?.localPath) {
                logger.error('Invalid song:', currentSong);
                return false;
            }

            logger.info('Loading current song:', currentSong.name, 'Index:', this.currentIndex);

            // İlk şarkı için özel kontrol
            const isFirstSong = this.currentIndex === 0;
            logger.info('Loading current song:', currentSong.name, 'Index:', this.currentIndex);

            // Önce önceki timer'ı temizle
            if (this.crossfadeTimer) {
                clearInterval(this.crossfadeTimer);
                this.crossfadeTimer = null;
            }

            // Eğer önceki bir howl instance varsa temizle
            if (this.currentHowl) {
                this.currentHowl.unload();
                this.currentHowl = null;
            }

            return new Promise((resolve) => {
                this.currentHowl = new Howl({
                    src: [currentSong.localPath],
                    html5: true,
                    volume: isFirstSong ? 0 : this.volume,
                    autoplay: false,
                    preload: true,
                    onload: () => {
                        logger.info('Song loaded successfully');
                        
                        if (isFirstSong) {
                            this.currentHowl.play();
                            this.playStartTime = Date.now();
                            
                            setTimeout(() => {
                                this.currentHowl.fade(0, this.volume, 500);
                                this.isPlaying = true;
                                
                                const currentSong = this.getCurrentSong();
                                if (this.onSongChangeCallback) {
                                    this.onSongChangeCallback(currentSong);
                                }

                                // Şarkı başladığında durumu gönder
                                this.sendPlaybackStatus(false);

                                const duration = this.currentHowl.duration();
                                if (duration) {
                                    this.setupCrossfadeTimer(duration);
                                }
                            }, 100);
                        } else {
                            this.currentHowl.play();
                            this.playStartTime = Date.now();
                            this.isPlaying = true;
                            
                            // Yeni şarkı başladığında durumu gönder
                            this.sendPlaybackStatus(false);
                            
                            const duration = this.currentHowl.duration();
                            if (duration) {
                                this.setupCrossfadeTimer(duration);
                            }
                        }
                        
                        resolve(true);
                    },
                    onend: () => {
                        logger.info('Song ended. Crossfading:', this.isCrossfading);
                        if (!this.isCrossfading) {
                            // Şarkı doğal olarak bittiğinde durumu gönder
                            this.isPlaying = false;
                            this.sendPlaybackStatus(true);
                            
                            if (this.onSongEndCallback) {
                                logger.info('Song ended naturally, sending event');
                                this.onSongEndCallback();
                            }

                            // Sonraki şarkıya geç
                            this.playNext();
                        }
                    },
                    onplay: () => {
                        logger.info('Song started playing:', currentSong.name);
                        this.playStartTime = Date.now();
                        this.isPlaying = true;
                        if (this.onPlaybackChangeCallback) {
                            this.onPlaybackChangeCallback(true);
                        }
                    },
                    onloaderror: (id, error) => {
                        logger.error('Error loading song:', error);
                        resolve(false);
                    }
                });
            });

            // Preload next song
            await this.preloadNext();
        } catch (error) {
            logger.error('Error in loadAndPlayCurrent:', error);
            return false;
        }
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

        // Adaptif süreleri hesapla
        this.fadeTime = this.calculateAdaptiveFadeTime(duration);
        this.crossfadeTime = this.calculateAdaptiveCrossfadeTime(duration);

        logger.info('Setting up adaptive crossfade timer. Duration:', duration, 
                   'Fade time:', this.fadeTime, 
                   'Crossfade at:', this.crossfadeTime);
        
        // Timer'ı class property olarak sakla
        this.crossfadeTimer = setInterval(() => {
            try {
                // Ses seviyesi örnekleme
                this.updateVolumeHistory();

                if (!this.currentHowl || !this.isPlaying) {
                    logger.warn('Clearing timer - howl or playing state invalid');
                    clearInterval(this.crossfadeTimer);
                    this.crossfadeTimer = null;
                    return;
                }

                const currentTime = this.currentHowl.seek();
                if (currentTime === null || isNaN(currentTime)) {
                    logger.warn('Invalid current time:', currentTime);
                    return;
                }

                const remainingTime = duration - currentTime;
                
                // Kalan süre negatifse veya çok küçükse
                if (remainingTime < 0 || remainingTime < 0.1) {
                    logger.warn('Invalid remaining time, forcing next song');
                    clearInterval(this.crossfadeTimer);
                    this.crossfadeTimer = null;
                    this.playNext();
                    return;
                }
                
                // Son crossfadeTime saniyeye geldik mi?
                if (remainingTime <= this.crossfadeTime) {
                    logger.info(`Triggering crossfade with ${remainingTime}s remaining`);
                    clearInterval(this.crossfadeTimer);
                    this.crossfadeTimer = null;
                    this.startCrossfade();
                }
            } catch (error) {
                logger.error('Error in timer:', error);
                clearInterval(this.crossfadeTimer);
                this.crossfadeTimer = null;
            }
        }, this.timerInterval);

        logger.info(`Adaptive crossfade timer setup complete - will trigger with ${this.crossfadeTime}s remaining`);
    }

    // Ses seviyesi analizi
    analyzeSoundLevels() {
        if (!this.currentHowl || !this.nextHowl) return null;

        try {
            // Mevcut şarkının son N örneğinin ortalamasını al
            const currentVolumeAvg = this.volumeHistory
                .slice(-this.volumeAnalysisWindow)
                .reduce((sum, vol) => sum + vol, 0) / this.volumeAnalysisWindow;

            // Sonraki şarkının başlangıç ses seviyesini al
            const nextVolume = this.nextHowl.volume();

            // Ses seviyeleri arasındaki farkı hesapla
            const volumeDiff = Math.abs(currentVolumeAvg - nextVolume);

            logger.info('Volume analysis - Current avg:', currentVolumeAvg, 'Next:', nextVolume, 'Diff:', volumeDiff);

            return {
                currentAvg: currentVolumeAvg,
                nextLevel: nextVolume,
                difference: volumeDiff
            };
        } catch (error) {
            logger.error('Error in sound level analysis:', error);
            return null;
        }
    }

    // Adaptif fade süresini hesapla
    calculateAdaptiveFadeTime(duration) {
        try {
            // Şarkı uzunluğuna göre base fade time hesapla
            const durationBasedTime = Math.min(
                this.crossfadeConfig.maxFadeTime,
                Math.max(
                    this.crossfadeConfig.minFadeTime,
                    duration * 0.1 // Şarkı süresinin %10'u
                )
            );

            // Ses seviyesi analizi yap
            const volumeAnalysis = this.analyzeSoundLevels();
            if (!volumeAnalysis) {
                return durationBasedTime;
            }

            // Ses seviyesi farkına göre fade süresini ayarla
            let adjustedTime = durationBasedTime;
            if (volumeAnalysis.difference > 0.3) { // Büyük ses farkı
                adjustedTime *= 1.2; // %20 daha uzun fade
            } else if (volumeAnalysis.difference < 0.1) { // Küçük ses farkı
                adjustedTime *= 0.8; // %20 daha kısa fade
            }

            // Min-max sınırları içinde tut
            return Math.min(
                this.crossfadeConfig.maxFadeTime,
                Math.max(this.crossfadeConfig.minFadeTime, adjustedTime)
            );
        } catch (error) {
            logger.error('Error calculating adaptive fade time:', error);
            return this.crossfadeConfig.defaultFadeTime;
        }
    }

    // Adaptif crossfade başlangıç zamanını hesapla
    calculateAdaptiveCrossfadeTime(duration) {
        try {
            // Şarkı uzunluğuna göre base crossfade time hesapla
            const baseCrossfadeTime = Math.min(
                this.crossfadeConfig.maxCrossfadeTime,
                Math.max(
                    this.crossfadeConfig.minCrossfadeTime,
                    duration * 0.05 // Şarkı süresinin %5'i
                )
            );

            // Ses analizi sonucuna göre ayarla
            const volumeAnalysis = this.analyzeSoundLevels();
            if (!volumeAnalysis) {
                return baseCrossfadeTime;
            }

            let adjustedTime = baseCrossfadeTime;
            if (volumeAnalysis.difference > 0.3) {
                adjustedTime *= 1.3; // %30 daha erken başla
            }

            return Math.min(
                this.crossfadeConfig.maxCrossfadeTime,
                Math.max(this.crossfadeConfig.minCrossfadeTime, adjustedTime)
            );
        } catch (error) {
            logger.error('Error calculating adaptive crossfade time:', error);
            return this.crossfadeConfig.defaultCrossfadeTime;
        }
    }

    // Ses seviyesi örnekleme
    updateVolumeHistory() {
        if (this.currentHowl) {
            try {
                const currentVolume = this.currentHowl.volume();
                this.volumeHistory.push(currentVolume);
                
                // Sadece son N örneği tut
                if (this.volumeHistory.length > this.volumeAnalysisWindow) {
                    this.volumeHistory.shift();
                }
            } catch (error) {
                logger.error('Error updating volume history:', error);
            }
        }
    }

    async startCrossfade() {
        logger.info('Starting crossfade...');
        
        // Crossfade durumunu işaretle
        this.isCrossfading = true;

        // Mevcut durumu kontrol et
        if (!this.currentHowl || !this.isPlaying) {
            logger.error('Invalid state for crossfade - current song not playing');
            this.isCrossfading = false;
            this.playNext();
            return;
        }

        // Mevcut şarkının tamamlandığını bildir
        this.isPlaying = false;
        this.sendPlaybackStatus(true);

        // nextHowl yoksa preload dene ve bekle
        if (!this.nextHowl) {
            logger.info('No next song preloaded, trying to load...');
            const preloadResult = await this.preloadNext();
            
            // Preload başarısız olduysa
            if (!preloadResult || !this.nextHowl) {
                logger.error('Could not load next song for crossfade');
                this.isCrossfading = false;
                if (this.currentHowl) {
                    await this.fadeOut(this.currentHowl);
                    this.currentHowl.stop();
                    this.currentHowl.unload();
                    this.currentHowl = null;
                }
                this.playNext();
                return;
            }
        }

        // Next howl durumunu kontrol et
        if (!this.nextHowl || this.nextHowl.state() !== 'loaded') {
            logger.error('Next song not ready for crossfade');
            this.isCrossfading = false;
            if (this.currentHowl) {
                await this.fadeOut(this.currentHowl);
                this.currentHowl.stop();
                this.currentHowl.unload();
                this.currentHowl = null;
            }
            this.playNext();
            return;
        }
        
        try {
            // İki şarkıyı aynı anda fade
            await Promise.all([
                this.fadeOut(this.currentHowl),
                this.fadeIn(this.nextHowl)
            ]);
            
            // Eski şarkıyı durdur ve temizle
            this.currentHowl.stop();
            this.currentHowl.unload();
            
            // Önce şarkı indexini güncelle
            this.currentIndex = (this.currentIndex + 1) % this.currentPlaylist.songs.length;
            
            // Sonra yeni howl'u current yap
            this.currentHowl = this.nextHowl;
            this.nextHowl = null;
            
            // Yeni şarkının başlangıç zamanını kaydet
            this.playStartTime = Date.now();
            
            // Şarkı değişimini bildir
            const currentSong = this.getCurrentSong();
            if (this.onSongChangeCallback) {
                this.onSongChangeCallback(currentSong);
            }

            // Yeni şarkının başladığını bildir
            this.isPlaying = true;
            this.sendPlaybackStatus(false);

            // IPC üzerinden ana sürece bildir
            if (ipcRenderer) {
                const songData = {
                    ...currentSong,
                    index: this.currentIndex
                };
                logger.info('Sending song-changed event:', songData);
                ipcRenderer.send('song-changed', songData);
            } else {
                logger.error('ipcRenderer not available for song-changed event');
            }
            
            // Bir sonraki şarkıyı yüklemeye başla
            this.preloadNext().catch(error => {
                logger.error('Error preloading next song after crossfade:', error);
            });

            // Yeni şarkı için timer'ı kur
            logger.info('Setting up timer for new song after crossfade');
            setTimeout(() => {
                this.isCrossfading = false;
                this.setupCrossfadeTimer();
            }, 500);
        } catch (error) {
            logger.error('Error during crossfade:', error);
            this.isCrossfading = false;
            // Hata durumunda temizlik yap
            if (this.currentHowl) {
                this.currentHowl.stop();
                this.currentHowl.unload();
                this.currentHowl = null;
            }
            if (this.nextHowl) {
                this.nextHowl.unload();
                this.nextHowl = null;
            }
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
        logger.info('Playing next song:', this.currentPlaylist.songs[this.currentIndex].name);
        this.loadAndPlayCurrent();
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

    // Cleanup fonksiyonu - tüm kaynakları temizler
    cleanup() {
        logger.info('Starting JukeboxPlayer cleanup');
        try {
            // Çalan şarkıyı durdur
            if (this.currentHowl) {
                this.currentHowl.stop();
                this.currentHowl.unload();
                this.currentHowl = null;
            }

            // Preload edilen şarkıyı temizle
            if (this.nextHowl) {
                this.nextHowl.unload();
                this.nextHowl = null;
            }

            // Timer'ları temizle
            if (this.crossfadeTimer) {
                clearTimeout(this.crossfadeTimer);
                this.crossfadeTimer = null;
            }

            if (this.fadeTimer) {
                clearInterval(this.fadeTimer);
                this.fadeTimer = null;
            }

            // State'i sıfırla
            this.currentSong = null;
            this.nextSong = null;
            this.isPlaying = false;
            this.isPaused = false;
            this.volumeHistory = [];
            this.fadeTime = this.crossfadeConfig.defaultFadeTime;

            logger.info('JukeboxPlayer cleanup completed successfully');
        } catch (error) {
            logger.error('Error during JukeboxPlayer cleanup:', error);
        }
    }

    // Howl instance'ını güvenli şekilde destroy eder
    destroyHowl(howl) {
        if (!howl) return;
        
        try {
            // Önce sesi kapat
            howl.volume(0);
            // Çalmayı durdur
            howl.stop();
            // Kaynakları temizle
            howl.unload();
            // Referansı kaldır
            howl = null;
        } catch (error) {
            logger.error('Error destroying Howl instance:', error);
        }
    }

    // Şarkı değiştirirken cleanup
    cleanupBeforeNext() {
        logger.info('Cleaning up before next song');
        try {
            // Mevcut şarkıyı temizle
            if (this.currentHowl) {
                this.destroyHowl(this.currentHowl);
                this.currentHowl = null;
            }

            // Timer'ları sıfırla
            if (this.crossfadeTimer) {
                clearTimeout(this.crossfadeTimer);
                this.crossfadeTimer = null;
            }

            if (this.fadeTimer) {
                clearInterval(this.fadeTimer);
                this.fadeTimer = null;
            }

            logger.info('Cleanup before next song completed');
        } catch (error) {
            logger.error('Error during cleanup before next song:', error);
        }
    }
}

module.exports = JukeboxPlayer;
