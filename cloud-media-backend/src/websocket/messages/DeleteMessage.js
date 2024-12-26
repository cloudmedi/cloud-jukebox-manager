class DeleteMessage {
  static createDeleteRequest(entityType, entityId) {
    return {
      type: 'delete',
      action: 'request',
      entityType,
      entityId
    };
  }

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
}

module.exports = DeleteMessage;