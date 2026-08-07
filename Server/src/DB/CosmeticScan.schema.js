const mongoose = require('mongoose');

const cosmeticScanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  productName: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    default: 'Unknown Brand',
  },
  ecoScore: {
    type: Number,
    required: true,
  },
  safetyRating: {
    type: String,
    enum: ['Safe', 'Moderate Risk', 'High Risk'],
    default: 'Safe',
  },
  harmfulChemicals: [{
    name: String,
    risk: String,
    description: String,
  }],
  greenAlternatives: [{
    name: String,
    brand: String,
    ecoScore: Number,
    link: String,
  }],
  scannedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('CosmeticScan', cosmeticScanSchema);
