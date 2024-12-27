const PlaylistDeleteHandler = require('./delete/handlers/PlaylistDeleteHandler');
const SongDeleteHandler = require('./delete/handlers/SongDeleteHandler');
const DeviceDeleteHandler = require('./delete/handlers/DeviceDeleteHandler');
const AnnouncementDeleteHandler = require('./delete/handlers/AnnouncementDeleteHandler');
const { createLogger } = require('../utils/logger');

const logger = createLogger('delete-service');

class DeleteService {
  constructor() {
    this.handlers = new Map([
      ['playlist', PlaylistDeleteHandler],
      ['song', SongDeleteHandler],
      ['device', DeviceDeleteHandler],
      ['announcement', AnnouncementDeleteHandler]
    ]);
  }

  async deleteEntity(type, id, options = {}) {
    logger.info(`Starting delete operation for ${type} with ID: ${id}`);
    
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler found for type: ${type}`);
    }

    try {
      const entity = await handler.preDelete(id, options);
      await handler.executeDelete(id, options, entity);
      await handler.postDelete(id, options);
      
      logger.info(`Successfully deleted ${type} with ID: ${id}`);
    } catch (error) {
      logger.error(`Error deleting ${type}:`, error);
      throw error;
    }
  }
}

module.exports = new DeleteService();