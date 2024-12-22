const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, 'Token zorunludur'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: props => `${props.value} geçerli bir token değil! Token 6 haneli bir sayı olmalıdır.`
    }
  },
  deviceInfo: {
    hostname: String,
    platform: String,
    arch: String,
    cpus: String,
    totalMemory: String,
    freeMemory: String,
    networkInterfaces: [String],
    osVersion: String
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;