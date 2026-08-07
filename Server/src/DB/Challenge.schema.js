const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. sapling, cleanup, transit, recycle, event
  title: { type: String, required: true },
  description: { type: String, required: true },
  rewardPoints: { type: Number, required: true },
  verificationType: { type: String, enum: ['photo', 'before_after', 'receipt', 'qr'], required: true },
  category: { type: String, default: 'General' },
  icon: { type: String, default: 'eco' },
  bgGradient: { type: String, default: 'from-primary-container to-surface-container-high' }
}, { timestamps: true });

module.exports = mongoose.model('Challenge', challengeSchema);
