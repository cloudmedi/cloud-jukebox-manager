const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: 'Token 6 haneli sayısal bir değer olmalıdır'
    }
  },
  deviceInfo: {
    hostname: String,
    platform: String,
    arch: String,
    cpus: String,
    totalMemory: String,
    freeMemory: String,
    networkInterfaces: [String]
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 saat sonra otomatik silinir
  }
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;