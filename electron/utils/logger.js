const winston = require('winston');
const path = require('path');
const { app } = require('electron');

const createLogger = (service) => {
  const logDir = app ? path.join(app.getPath('userData'), 'logs') : path.join(__dirname, '../../logs');
  
  // Log dizinini oluştur
  require('fs').mkdirSync(logDir, { recursive: true });

  return winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error'
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log')
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};

module.exports = { createLogger };