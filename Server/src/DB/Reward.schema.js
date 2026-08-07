const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  partner: String,
  pointsRequired: {
    type: Number,
    required: true,
  },
  discountCode: String,
  description: String,
  category: String,
  imageUrl: String,
  expiryDays: Number,
});

module.exports = mongoose.model('Reward', rewardSchema);
