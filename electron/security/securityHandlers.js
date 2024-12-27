const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

function setupSecurityHandlers() {
  // Dosya işlemleri için güvenli handler'lar
  ipcMain.handle('file:read', async (event, filePath) => {
    if (!isPathSafe(filePath)) {
      throw new Error('Invalid file path');
    }
    return fs.promises.readFile(filePath, 'utf8');
  });

  ipcMain.handle('file:write', async (event, filePath, data) => {
    if (!isPathSafe(filePath)) {
      throw new Error('Invalid file path');
    }
    const sanitizedData = sanitizeInput(data);
    return fs.promises.writeFile(filePath, sanitizedData);
  });

  ipcMain.handle('file:delete', async (event, filePath) => {
    if (!isPathSafe(filePath)) {
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
    
    // Log dosyasına güvenli şekilde yaz
    fs.appendFileSync(
      path.join(__dirname, '../logs/security.log'),
      JSON.stringify(logEntry) + '\n',
      { flag: 'a' }
    );
  }

  // Global error handler
  process.on('uncaughtException', (error) => {
    logSecurityEvent('uncaughtException', {
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
  sanitizeInput
};