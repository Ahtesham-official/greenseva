const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengeKey: { type: String, required: true }, // 'sapling' | 'cleanup' | 'transit' | 'recycle' | 'event'
  proofUrls: [{ type: String }],
  qrCode: { type: String },
  status: {
    type: String,
    enum: ['Accepted', 'Pending Verification', 'AI Verified', 'Approved', 'Rewarded', 'Rejected'],
    default: 'Accepted'
  },
  aiScore: { type: Number, default: 0 },
  aiNotes: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
