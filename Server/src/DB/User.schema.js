const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  },
  phone: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
  pincode: {
    type: String,
    default: "",
  },
  greenPoints: {
    type: Number,
    default: 250,
  },
  co2SavedKg: {
    type: Number,
    default: 14.2,
  },
  itemsRescued: {
    type: Number,
    default: 8,
  },
  scanCount: {
    type: Number,
    default: 12,
  },
  streakDays: {
    type: Number,
    default: 5,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'NGO'],
    default: 'user',
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);