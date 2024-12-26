const { createLogger } = require('../../../utils/logger');

class BaseDeleteHandler {
  constructor(type) {
    this.type = type;
    this.logger = createLogger(`${type}DeleteHandler`);
  }

  async delete(id, data) {
    this.logger.info(`Starting delete operation for ${this.type} with ID: ${id}`);
    
    try {
      await this.preDelete(id, data);
      await this.executeDelete(id, data);
      await this.postDelete(id, data);
      
      this.logger.info(`Successfully completed delete operation for ${this.type} with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Error in delete operation for ${this.type}:`, error);
      throw error;
    }
  }

  async preDelete(id, data) {
    // Alt sınıflar tarafından implement edilecek
    this.logger.info(`Pre-delete phase for ${this.type} with ID: ${id}`);
  }

  async executeDelete(id, data) {
    // Alt sınıflar tarafından implement edilecek
    this.logger.info(`Execute delete phase for ${this.type} with ID: ${id}`);
  }

  async postDelete(id, data) {
    // Alt sınıflar tarafından implement edilecek
    this.logger.info(`Post-delete phase for ${this.type} with ID: ${id}`);
  }
}

module.exports = BaseDeleteHandler;