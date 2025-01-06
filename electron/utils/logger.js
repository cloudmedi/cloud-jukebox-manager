const winston = require('winston');
const path = require('path');
const { app } = require('electron');

const createLogger = (service) => {
  const logDir = app ? path.join(app.getPath('userData'), 'logs') : path.join(__dirname, '../../logs');
  
  // Log dizinini oluştur
  require('fs').mkdirSync(logDir, { recursive: true });

  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${service}] ${level}: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
      })
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  return logger;
};

module.exports = { createLogger };