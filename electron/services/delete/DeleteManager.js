const { BrowserWindow } = require('electron');
const { createLogger } = require('../../utils/logger');
const PlaylistDeleteHandler = require('./handlers/PlaylistDeleteHandler');
const SongDeleteHandler = require('./handlers/SongDeleteHandler');
const DeviceDeleteHandler = require('./handlers/DeviceDeleteHandler');
const AnnouncementDeleteHandler = require('./handlers/AnnouncementDeleteHandler');
const GroupDeleteHandler = require('./handlers/GroupDeleteHandler');

const logger = createLogger('DeleteManager');

class DeleteManager {
  constructor() {
    this.handlers = new Map([
      ['playlist', new PlaylistDeleteHandler()],
      ['song', new SongDeleteHandler()],
      ['device', new DeviceDeleteHandler()],
      ['announcement', new AnnouncementDeleteHandler()],
      ['group', new GroupDeleteHandler()]
    ]);
  }

  async handleDelete(message) {
    const { type, id, data } = message;
    logger.info(`Handling delete request for ${type} with ID: ${id}`);

    try {
      const handler = this.handlers.get(type);
      if (!handler) {
        throw new Error(`No handler found for type: ${type}`);
      }

      // İşlem başladı bildirimi
      this.notifyUI('delete-started', { type, id });

      // Silme işlemini gerçekleştir
      await handler.delete(id, data);

      // Başarılı silme bildirimi
      this.notifyUI('delete-success', { type, id });
      logger.info(`Successfully deleted ${type} with ID: ${id}`);

    } catch (error) {
      logger.error(`Error deleting ${type}:`, error);
      this.notifyUI('delete-error', { type, id, error: error.message });
      throw error;
    }
  }

  notifyUI(event, data) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send(event, data);
    }
  }
}

module.exports = new DeleteManager();