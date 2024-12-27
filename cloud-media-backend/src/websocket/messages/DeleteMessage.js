class DeleteMessage {
  static createDeleteStarted(entityType, entityId, data = {}) {
    return {
      type: 'delete',
      action: 'started',
      entityType,
      entityId,
      data
    };
  }

  static createDeleteSuccess(entityType, entityId, data = {}) {
    return {
      type: 'delete',
      action: 'success',
      entityType,
      entityId,
      data
    };
  }

  static createDeleteError(entityType, entityId, error) {
    return {
      type: 'delete',
      action: 'error',
      entityType,
      entityId,
      error: error.message || error
    };
  }
}

module.exports = DeleteMessage;