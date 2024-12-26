const DeleteMessage = {
  createDeleteStarted(entityType, entityId) {
    return {
      type: 'delete',
      action: 'started',
      entityType,
      entityId
    };
  },

  createDeleteSuccess(entityType, entityId) {
    return {
      type: 'delete',
      action: 'success',
      entityType,
      entityId
    };
  },

  createDeleteError(entityType, entityId, error) {
    return {
      type: 'delete',
      action: 'error',
      entityType,
      entityId,
      error: error.message || error
    };
  }
};

module.exports = DeleteMessage;