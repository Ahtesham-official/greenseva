const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rewardId: { type: String, required: true },
  rewardTitle: { type: String, required: true },
  pointsSpent: { type: Number, required: true },
  discountCode: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'redeemed'],
    default: 'pending'
  },
  requestedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Redemption', redemptionSchema);
