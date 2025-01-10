const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { app } = require('electron');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('schedule-download');

class ScheduleDownloadManager {
  constructor() {
    this.downloadPath = path.join(app.getPath('userData'), 'schedules');
    this.downloadQueue = [];
    this.downloadStates = new Map();
    this.isProcessing = false;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    this.initialize();
  }

  async initialize() {
    // schedules klasörünü oluştur
    if (!fs.existsSync(this.downloadPath)) {
      await fs.promises.mkdir(this.downloadPath, { recursive: true });
    }
  }

  async downloadSchedulePlaylist(schedule) {
    try {
      logger.info(`[Schedule Download] Starting download for schedule: ${schedule.id}`);
      const schedulePath = path.join(this.downloadPath, schedule.id);

      // Schedule klasörünü oluştur
      if (!fs.existsSync(schedulePath)) {
        await fs.promises.mkdir(schedulePath, { recursive: true });
      }

      // İndirme durumunu başlat
      this.downloadStates.set(schedule.id, {
        status: 'downloading',
        progress: 0,
        totalSongs: schedule.playlist.songs.length,
        downloadedSongs: 0,
        startTime: new Date(),
        schedule: schedule
      });

      // Şarkıları kuyruğa ekle
      for (const song of schedule.playlist.songs) {
        this.downloadQueue.push({
          scheduleId: schedule.id,
          song: song,
          priority: this.calculatePriority(schedule)
        });
      }

      // Kuyruğu işlemeye başla
      if (!this.isProcessing) {
        this.processQueue();
      }

      return true;
    } catch (error) {
      logger.error(`[Schedule Download] Error starting download for schedule: ${schedule.id}`, error);
      this.downloadStates.set(schedule.id, {
        status: 'error',
        error: error.message,
        schedule: schedule
      });
      return false;
    }
  }

  calculatePriority(schedule) {
    const now = new Date();
    const startDate = new Date(schedule.startDate);
    const timeUntilStart = startDate - now;

    // 1 saat içinde başlayacaklar: Yüksek öncelik
    if (timeUntilStart <= 60 * 60 * 1000) {
      return 3;
    }
    // 24 saat içinde başlayacaklar: Orta öncelik
    else if (timeUntilStart <= 24 * 60 * 60 * 1000) {
      return 2;
    }
    // Diğerleri: Düşük öncelik
    return 1;
  }

  async processQueue() {
    if (this.downloadQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    // Önceliğe göre sırala
    this.downloadQueue.sort((a, b) => b.priority - a.priority);

    const item = this.downloadQueue.shift();
    const { scheduleId, song } = item;
    const songId = song.id || song._id;

    try {
      const state = this.downloadStates.get(scheduleId);
      if (!state || state.status === 'error') {
        return;
      }

      const schedulePath = path.join(this.downloadPath, scheduleId);
      const songPath = path.join(schedulePath, `${songId}.mp3`);

      // Şarkı zaten indirilmiş mi kontrol et
      if (fs.existsSync(songPath)) {
        logger.info(`[Schedule Download] Song already exists: ${songId} for schedule: ${scheduleId}`);
        this.updateDownloadProgress(scheduleId);
        setImmediate(() => this.processQueue());
        return;
      }

      // Şarkıyı indir
      logger.info(`[Schedule Download] Starting download for song: ${songId} (${song.name}) for schedule: ${scheduleId}`);
      
      // Doğrudan path'i kullan
      const downloadUrl = `${this.baseUrl}/${song.path.replace(/\\/g, '/')}`;
      logger.info(`[Schedule Download] Download URL: ${downloadUrl}`);

      const response = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream',
        validateStatus: false
      });

      // HTTP durumunu kontrol et
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Failed to download song ${songId}`);
      }

      const writer = fs.createWriteStream(songPath);
      
      response.data.pipe(writer);

      writer.on('finish', () => {
        logger.info(`[Schedule Download] Successfully downloaded song: ${songId} for schedule: ${scheduleId}`);
        this.updateDownloadProgress(scheduleId);
        setImmediate(() => this.processQueue());
      });

      writer.on('error', (error) => {
        logger.error(`[Schedule Download] Error writing song file: ${songId}`, { 
          error: error.message,
          scheduleId,
          songId: songId,
          path: songPath
        });
        this.handleDownloadError(scheduleId, new Error(`Error writing song file: ${error.message}`));
        setImmediate(() => this.processQueue());
      });

      response.data.on('error', (error) => {
        logger.error(`[Schedule Download] Error downloading song: ${songId}`, {
          error: error.message,
          scheduleId,
          songId: songId,
          url: downloadUrl
        });
        writer.end();
        this.handleDownloadError(scheduleId, new Error(`Error downloading song: ${error.message}`));
        setImmediate(() => this.processQueue());
      });

    } catch (error) {
      logger.error(`[Schedule Download] Error processing queue item`, {
        error: error.message,
        scheduleId,
        songId: songId,
        url: `${this.baseUrl}/${song.path.replace(/\\/g, '/')}`
      });
      this.handleDownloadError(scheduleId, error);
      setImmediate(() => this.processQueue());
    }
  }

  updateDownloadProgress(scheduleId) {
    const state = this.downloadStates.get(scheduleId);
    if (state) {
      state.downloadedSongs += 1;
      state.progress = (state.downloadedSongs / state.totalSongs) * 100;

      if (state.downloadedSongs === state.totalSongs) {
        state.status = 'completed';
        state.endTime = new Date();
        logger.info(`[Schedule Download] Completed all downloads for schedule: ${scheduleId}`, {
          totalSongs: state.totalSongs,
          duration: state.endTime - state.startTime
        });
      } else {
        logger.info(`[Schedule Download] Progress for schedule: ${scheduleId}`, {
          downloaded: state.downloadedSongs,
          total: state.totalSongs,
          progress: `${state.progress.toFixed(2)}%`
        });
      }

      this.downloadStates.set(scheduleId, state);
    }
  }

  handleDownloadError(scheduleId, error) {
    const state = this.downloadStates.get(scheduleId);
    if (state) {
      state.status = 'error';
      state.error = error.message;
      this.downloadStates.set(scheduleId, state);
      
      logger.error(`[Schedule Download] Download failed for schedule: ${scheduleId}`, {
        error: error.message,
        downloadedSongs: state.downloadedSongs,
        totalSongs: state.totalSongs
      });
    }
  }

  getDownloadStatus(scheduleId) {
    return this.downloadStates.get(scheduleId);
  }

  async cleanupSchedule(scheduleId) {
    try {
      if (!scheduleId) {
        logger.error('[Schedule Download] Cannot cleanup schedule: Invalid schedule ID');
        return;
      }

      const schedulePath = path.join(this.downloadPath, scheduleId);
      
      if (!fs.existsSync(schedulePath)) {
        logger.info(`[Schedule Download] No files to cleanup for schedule: ${scheduleId}`);
        return;
      }

      // Dizini sil
      await fs.promises.rm(schedulePath, { recursive: true, force: true });
      logger.info(`[Schedule Download] Cleaned up files for schedule: ${scheduleId}`);

      // Download durumunu temizle
      this.downloadStates.delete(scheduleId);

    } catch (error) {
      logger.error(`[Schedule Download] Error cleaning up schedule: ${scheduleId}`, {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    }
  }

  async cleanupExpiredSchedules() {
    const now = new Date();
    for (const [scheduleId, state] of this.downloadStates) {
      if (state.schedule && new Date(state.schedule.endDate) < now) {
        await this.cleanupSchedule(scheduleId);
      }
    }
  }
}

module.exports = new ScheduleDownloadManager();
