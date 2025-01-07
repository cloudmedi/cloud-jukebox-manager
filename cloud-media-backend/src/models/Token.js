const mongoose = require('mongoose');

// Karışıklığa neden olabilecek karakterleri çıkardık:
// Çıkarılanlar: 0, O, 1, I, l
const ALLOWED_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, 'Token zorunludur'],
    unique: true,
    validate: {
      validator: function(v) {
        // 6 karakterli ve sadece izin verilen karakterleri içermeli
        if (v.length !== 6) return false;
        return v.split('').every(char => ALLOWED_CHARS.includes(char));
      },
      message: props => `${props.value} geçerli bir token değil! Token 6 karakterli olmalı ve sadece izin verilen karakterleri içermelidir.`
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

// Token için benzersizlik indeksi
tokenSchema.index({ token: 1 }, { unique: true });

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;