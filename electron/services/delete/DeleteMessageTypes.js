// Silme mesajları için standart formatlar
const DeleteMessageTypes = {
  // Silme isteği formatı
  REQUEST: {
    type: 'delete',
    action: 'request',
    entityType: null, // 'playlist', 'song', 'device', 'announcement', 'group'
    entityId: null,
    data: {} // Ek veriler
  },

  // Silme başladı bildirimi
  STARTED: {
    type: 'delete',
    action: 'started',
    entityType: null,
    entityId: null
  },

  // Silme başarılı bildirimi
  SUCCESS: {
    type: 'delete',
    action: 'success',
    entityType: null,
    entityId: null
  },

  // Silme hatası bildirimi
  ERROR: {
    type: 'delete',
    action: 'error',
    entityType: null,
    entityId: null,
    error: null
  }
};

// Mesaj oluşturucu yardımcı fonksiyonlar
const createDeleteRequest = (entityType, entityId, data = {}) => ({
  ...DeleteMessageTypes.REQUEST,
  entityType,
  entityId,
  data
});

const createDeleteStarted = (entityType, entityId) => ({
  ...DeleteMessageTypes.STARTED,
  entityType,
  entityId
});

const createDeleteSuccess = (entityType, entityId) => ({
  ...DeleteMessageTypes.SUCCESS,
  entityType,
  entityId
});

const createDeleteError = (entityType, entityId, error) => ({
  ...DeleteMessageTypes.ERROR,
  entityType,
  entityId,
  error: error.message || error
});

module.exports = {
  DeleteMessageTypes,
  createDeleteRequest,
  createDeleteStarted,
  createDeleteSuccess,
  createDeleteError
};