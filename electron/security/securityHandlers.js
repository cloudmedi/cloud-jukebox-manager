const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const winston = require('winston');

// Güvenli dosya yolu doğrulama
function isPathSafe(filePath) {
  const normalizedPath = path.normalize(filePath);
  const appDir = path.resolve(__dirname, '..');
  return normalizedPath.startsWith(appDir);
}

// Input sanitization
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.replace(/[;&|`$]/g, '');
  }
  return input;
}

// Güvenlik logger'ı
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'security-service' },
  transports: [
    new winston.transports.File({ filename: 'security-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'security.log' })
  ]
});

function setupSecurityHandlers() {
  // Dosya işlemleri için güvenli handler'lar
  ipcMain.handle('file:read', async (event, filePath) => {
    if (!isPathSafe(filePath)) {
      securityLogger.error('Invalid file path access attempt', { path: filePath });
      throw new Error('Invalid file path');
    }
    return fs.promises.readFile(filePath, 'utf8');
  });

  ipcMain.handle('file:write', async (event, filePath, data) => {
    if (!isPathSafe(filePath)) {
      securityLogger.error('Invalid file write attempt', { path: filePath });
      throw new Error('Invalid file path');
    }
    const sanitizedData = sanitizeInput(data);
    return fs.promises.writeFile(filePath, sanitizedData);
  });

  ipcMain.handle('file:delete', async (event, filePath) => {
    if (!isPathSafe(filePath)) {
      securityLogger.error('Invalid file delete attempt', { path: filePath });
      throw new Error('Invalid file path');
    }
    return fs.promises.unlink(filePath);
  });

  // Audit logging
  function logSecurityEvent(event, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      details,
      hash: crypto.createHash('sha256').update(`${timestamp}${event}${JSON.stringify(details)}`).digest('hex')
    };
    
    securityLogger.info('Security event', logEntry);
  }

  // Global error handler
  process.on('uncaughtException', (error) => {
    securityLogger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack
    });
  });

  // WebSocket güvenlik kontrolleri
  ipcMain.on('websocket-message', (event, message) => {
    const sanitizedMessage = sanitizeInput(message);
    logSecurityEvent('websocket-message', {
      message: sanitizedMessage
    });
  });
}

module.exports = {
  setupSecurityHandlers,
  isPathSafe,
  sanitizeInput,
  securityLogger
};