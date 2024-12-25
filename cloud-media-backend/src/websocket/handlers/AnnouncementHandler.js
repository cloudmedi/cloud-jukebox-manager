const { createLogger } = require('../../utils/logger');

const logger = createLogger('AnnouncementHandler');

class AnnouncementHandler {
  constructor(wss, cleanupService) {
    this.wss = wss;
    this.cleanupService = cleanupService;
  }

  handleMessage(message, deviceToken) {
    switch (message.type) {
      case 'announcementDeleted':
        this.handleDeletionConfirmation(message, deviceToken);
        break;
      default:
        logger.warn(`Unknown announcement message type: ${message.type}`);
    }
  }

  handleDeletionConfirmation(message, deviceToken) {
    const { announcementId, success } = message;
    this.cleanupService.handleDeletionConfirmation(deviceToken, announcementId, success);
  }
}

module.exports = AnnouncementHandler;