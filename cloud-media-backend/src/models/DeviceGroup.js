const mongoose = require('mongoose');

const deviceGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Grup adı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  devices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Grup silme işleminden önce cihazların grup referanslarını temizle
deviceGroupSchema.pre('remove', async function(next) {
  const Device = mongoose.model('Device');
  await Device.updateMany(
    { groupId: this._id },
    { $set: { groupId: null } }
  );
  next();
});

// Gruptaki cihaz sayısını getiren helper method
deviceGroupSchema.methods.getDeviceCount = function() {
  return this.devices.length;
};

const DeviceGroup = mongoose.model('DeviceGroup', deviceGroupSchema);

module.exports = DeviceGroup;