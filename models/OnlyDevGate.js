const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const onlyDevGateSchema = new mongoose.Schema({
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

onlyDevGateSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

onlyDevGateSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('OnlyDevGate', onlyDevGateSchema);
