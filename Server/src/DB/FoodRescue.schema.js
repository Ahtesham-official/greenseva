const mongoose = require('mongoose');

const foodRescueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  providerName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Meals', 'Produce', 'Bakery', 'Dairy', 'Groceries'],
    default: 'Meals',
  },
  description: String,
  originalPrice: Number,
  discountedPrice: Number,
  quantityAvailable: {
    type: Number,
    default: 1,
  },
  location: String,
  expiresInHours: Number,
  imageUrl: String,
  claimedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claimedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('FoodRescue', foodRescueSchema);
