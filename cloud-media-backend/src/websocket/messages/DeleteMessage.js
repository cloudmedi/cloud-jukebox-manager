class DeleteMessage {
  static createDeleteStarted(entityType, entityId) {
    return {
      type: 'delete',
      action: 'started',
      entityType,
      entityId
    };
  }

  static createDeleteSuccess(entityType, entityId) {
    return {
      type: 'delete',
      action: 'success',
      entityType,
      entityId
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

  static createDeleteConfirmation(entityType, entityId) {
    return {
      type: 'delete',
      action: 'confirmation',
      entityType,
      entityId
    };
  }
}

module.exports = DeleteMessage;