const mongoose = require('mongoose');

const groupHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'clone'],
    required: true
  },
  changes: mongoose.Schema.Types.Mixed,
  performedBy: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

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
  parentGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceGroup',
    default: null
  },
  path: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceGroup'
  }],
  level: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFavorite: {
    type: Boolean,
    default: false
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
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: {
    type: String,
    trim: true
  },
  history: [groupHistorySchema],
  statistics: {
    totalDevices: Number,
    activeDevices: Number,
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Pre-save middleware to update path and level
deviceGroupSchema.pre('save', async function(next) {
  if (this.parentGroup) {
    const parent = await this.constructor.findById(this.parentGroup);
    if (parent) {
      this.path = [...parent.path, parent._id];
      this.level = parent.level + 1;
    }
  } else {
    this.path = [];
    this.level = 0;
  }
  next();
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

// Alt grupları getiren method
deviceGroupSchema.methods.getSubgroups = function() {
  return this.constructor.find({ parentGroup: this._id });
};

// Üst grupları getiren method
deviceGroupSchema.methods.getAncestors = function() {
  return this.constructor.find({ _id: { $in: this.path } });
};

// Grup klonlama methodu
deviceGroupSchema.methods.clone = async function(newName, createdBy) {
  const clone = new DeviceGroup({
    name: newName,
    description: this.description,
    devices: [...this.devices],
    status: this.status,
    createdBy: createdBy,
    isTemplate: false,
    tags: [...this.tags],
    parentGroup: this.parentGroup,
  });

  await clone.save();
  return clone;
};

// Grup şablonu oluşturma methodu
deviceGroupSchema.statics.createTemplate = async function(groupData) {
  const template = new DeviceGroup({
    ...groupData,
    isTemplate: true,
    templateName: groupData.name
  });

  await template.save();
  return template;
};

// İstatistikleri güncelleme methodu
deviceGroupSchema.methods.updateStatistics = async function() {
  const Device = mongoose.model('Device');
  const totalDevices = this.devices.length;
  const activeDevices = await Device.countDocuments({
    _id: { $in: this.devices },
    isOnline: true
  });

  this.statistics = {
    totalDevices,
    activeDevices,
    lastUpdated: new Date()
  };

  await this.save();
  return this.statistics;
};

const DeviceGroup = mongoose.model('DeviceGroup', deviceGroupSchema);

module.exports = DeviceGroup;