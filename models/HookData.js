const mongoose = require('mongoose');

const hookDataSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  phoneNumbers: [{
    type: String,
    required: true
  }],
  totalCount: {
    type: Number,
    required: true,
    default: 0
  },
  fileName: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HookData', hookDataSchema);
