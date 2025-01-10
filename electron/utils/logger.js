const winston = require('winston');
const path = require('path');
const electron = require('electron');

// Log deduplication için cache
const logCache = new Map();
const LOG_CACHE_TTL = 5000; // 5 saniye

// Custom format tanımla
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  
  return msg;
});

// Log mesajını kontrol et ve duplicate'leri engelle
function isDuplicateLog(level, message) {
  const key = `${level}:${message}`;
  const now = Date.now();
  
  // Eski cache girişlerini temizle
  for (const [cachedKey, timestamp] of logCache.entries()) {
    if (now - timestamp > LOG_CACHE_TTL) {
      logCache.delete(cachedKey);
    }
  }
  
  // Bu log son 5 saniye içinde yazıldı mı kontrol et
  if (logCache.has(key) && (now - logCache.get(key)) < LOG_CACHE_TTL) {
    return true;
  }
  
  // Yeni log'u cache'e ekle
  logCache.set(key, now);
  return false;
}

// Log dizinini al
function getLogDir() {
  // Main process
  if (electron.app) {
    return path.join(electron.app.getPath('userData'), 'logs');
  }
  // Renderer process
  else if (electron.remote) {
    return path.join(electron.remote.app.getPath('userData'), 'logs');
  }
  // Fallback - development ortamı
  else {
    return path.join(__dirname, '../../logs');
  }
}

function createLogger(category) {
  const logDir = getLogDir();
  
  // Log dizinini oluştur
  try {
    require('fs').mkdirSync(logDir, { recursive: true });
  } catch (error) {
    console.warn('Could not create log directory:', error);
  }

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      // Console transport with deduplication
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          customFormat
        ),
        log(info, callback) {
          if (!isDuplicateLog(info.level, info.message)) {
            console.log(info);
          }
          callback();
        }
      })
    ]
  });

  // File transport'u sadece dizin oluşturulabilirse ekle
  try {
    logger.add(new winston.transports.File({
      filename: path.join(logDir, `${category}.log`),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      log(info, callback) {
        if (!isDuplicateLog(info.level, info.message)) {
          this.write(info);
        }
        callback();
      }
    }));
  } catch (error) {
    console.warn('Could not add file transport:', error);
  }

  // Error handling
  logger.on('error', error => {
    console.error('Logger error:', error);
  });

  return logger;
}

module.exports = {
  createLogger
};