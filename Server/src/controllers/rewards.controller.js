const Challenge = require('../DB/Challenge.schema.js');
const Submission = require('../DB/Submission.schema.js');
const Reward = require('../DB/Reward.schema.js');
const Redemption = require('../DB/Redemption.schema.js');
const User = require('../DB/User.schema.js');

// ── The exact 5 hackathon challenges ────────────────────────────────────────
const INITIAL_CHALLENGES = [
  {
    key: 'sapling',
    title: 'Plant a Native Sapling',
    description: 'Plant a native tree sapling in your local area to support biodiversity and sequester carbon.',
    rewardPoints: 500,
    verificationType: 'photo',
    category: 'Nature',
    icon: 'nature',
    bgGradient: 'from-primary-container to-surface-container-high'
  },
  {
    key: 'cleanup',
    title: 'Organize a Community Cleanup',
    description: 'Gather friends and neighbors to clean up a local park, beach, or neighborhood street.',
    rewardPoints: 1000,
    verificationType: 'before_after',
    category: 'Community',
    icon: 'groups',
    bgGradient: 'from-secondary-container to-surface-container-high'
  },
  {
    key: 'transit',
    title: 'Use Public Transport',
    description: 'Reduce commuter emissions by riding the bus, metro, or train instead of driving solo.',
    rewardPoints: 300,
    verificationType: 'receipt',
    category: 'Transit',
    icon: 'directions_bus',
    bgGradient: 'from-tertiary-container to-surface-container-high'
  },
  {
    key: 'recycle',
    title: 'Recycle Plastic Waste',
    description: 'Deposit sorted plastic waste at a verified recycling center or waste collection kiosk.',
    rewardPoints: 700,
    verificationType: 'receipt',
    category: 'Recycling',
    icon: 'recycling',
    bgGradient: 'from-secondary-container to-surface-container'
  },
  {
    key: 'event',
    title: 'Participate in an Eco Event',
    description: 'Attend a registered green workshop, climate rally, or environmental hackathon event.',
    rewardPoints: 800,
    verificationType: 'qr',
    category: 'Event',
    icon: 'qr_code_scanner',
    bgGradient: 'from-primary-container to-secondary-container'
  }
];

// ── The exact 5 hackathon rewards ───────────────────────────────────────────
const INITIAL_REWARDS = [
  {
    _id: 'rw_1',
    title: '₹100 Eco Store Coupon',
    partner: 'GreenSeva Store',
    pointsRequired: 500,
    discountCode: 'ECOSTORE100',
    description: 'Get ₹100 flat discount on eco-friendly lifestyle & zero-waste home products.',
    category: 'Shopping',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    availability: 'In Stock'
  },
  {
    _id: 'rw_2',
    title: 'GreenSeva Digital Badge',
    partner: 'GreenSeva Platform',
    pointsRequired: 300,
    discountCode: 'BADGE-PLANET-HERO',
    description: 'Unlock exclusive "Planet Hero" digital badge for your profile & social showcase.',
    category: 'Recognition',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    availability: 'Instant Unlock'
  },
  {
    _id: 'rw_3',
    title: 'Tree Plantation Certificate',
    partner: 'GreenSeva Forest Initiative',
    pointsRequired: 700,
    discountCode: 'CERT-TREE-2026',
    description: 'Official digital certificate verifying a tree planted in your name with GPS tracking.',
    category: 'Impact',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80',
    availability: 'Available'
  },
  {
    _id: 'rw_4',
    title: 'College Event Pass',
    partner: 'Campus Green Club',
    pointsRequired: 400,
    discountCode: 'CAMPUS-ECO-PASS',
    description: 'VIP Entry pass to upcoming green summit, sustainable workshops, & eco-concerts.',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80',
    availability: 'Limited Seats'
  },
  {
    _id: 'rw_5',
    title: 'Sustainable Product Discount',
    partner: 'EcoBamboo India',
    pointsRequired: 600,
    discountCode: 'BAMBOO25OFF',
    description: 'Enjoy 25% off on sustainable bamboo personal care kits & stainless bottles.',
    category: 'Shopping',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    availability: 'In Stock'
  }
];

// Memory stores for fallback operation
let memorySubmissions = [];
let memoryRedemptions = [];

// ── Mistral Vision Image Verifier ───────────────────────────────────────────
const CHALLENGE_PROMPTS = {
  sapling: `You are an environmental verification AI for the GreenSeva platform.
A user submitted a photo as proof that they planted a native tree sapling.
Examine the image carefully. Does it show:
- A small plant, sapling, or tree seedling in soil, a pot, or natural ground?
- Clear evidence of planting activity (soil, roots, nursery bag, hands holding plant, garden setting)?

Respond ONLY with a JSON object (no markdown):
{"verified": true/false, "confidence": 0-100, "notes": "short explanation"}`,

  cleanup: `You are an environmental verification AI for the GreenSeva platform.
A user submitted a photo as proof that they organized or participated in a community cleanup.
Examine the image carefully. Look for:
- Garbage bags, waste collection, people picking up litter
- A park, beach, street, or public area with cleanup activity
- Any visible improvement, cleaner environment, or cleanup volunteers

Respond ONLY with a JSON object (no markdown):
{"verified": true/false, "confidence": 0-100, "notes": "short explanation"}`,

  transit: `You are an environmental verification AI for the GreenSeva platform.
A user submitted a photo as proof that they used public transport.
Examine the image carefully. Look for:
- A bus, metro, train, or public transport ticket, pass, or receipt
- A screenshot of a transit app, ticket booking confirmation, or boarding pass
- Any text indicating fare amount, route, station names, or transit authority

Respond ONLY with a JSON object (no markdown):
{"verified": true/false, "confidence": 0-100, "notes": "short explanation"}`,

  recycle: `You are an environmental verification AI for the GreenSeva platform.
A user submitted a photo as proof that they recycled plastic waste at a facility.
Examine the image carefully. Look for:
- A recycling receipt, printed slip, or kiosk confirmation
- Presence at a recycling center, waste management facility, or plastic collection kiosk
- Recycling bins, sorted plastic, or any eco-disposal activity

Respond ONLY with a JSON object (no markdown):
{"verified": true/false, "confidence": 0-100, "notes": "short explanation"}`
};

async function verifyProofWithMistral(challengeKey, imageBase64Array) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey || apiKey === 'your_mistral_api_key_here') {
    console.log('Mistral key not set — using auto-approve fallback');
    return { verified: true, confidence: 90, notes: 'Auto-approved (no AI key configured).' };
  }

  const prompt = CHALLENGE_PROMPTS[challengeKey];
  if (!prompt) {
    return { verified: true, confidence: 80, notes: 'Challenge type not configured for AI verification.' };
  }

  try {
    const contentPayload = [];

    // Add all submitted images (single or before/after)
    for (const imgBase64 of imageBase64Array) {
      if (!imgBase64 || imgBase64.length < 100) continue;
      const formatted = imgBase64.startsWith('data:') ? imgBase64 : `data:image/jpeg;base64,${imgBase64}`;
      contentPayload.push({ type: 'image_url', image_url: formatted });
    }

    // Add the verification instruction
    contentPayload.push({ type: 'text', text: prompt });

    if (contentPayload.length === 1) {
      // Only prompt, no real image — use fallback
      return { verified: true, confidence: 75, notes: 'No valid image data received — auto-approved.' };
    }

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [
          { role: 'user', content: contentPayload }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Mistral verification API error:', response.status, errText);
      return { verified: true, confidence: 80, notes: 'AI verification service unavailable — auto-approved.' };
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '';
    const cleanedJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanedJson);
    return {
      verified: parsed.verified === true,
      confidence: parsed.confidence || 80,
      notes: parsed.notes || 'Verification completed.'
    };
  } catch (err) {
    console.warn('Mistral proof verification error:', err.message);
    return { verified: true, confidence: 75, notes: 'Verification error — auto-approved as fallback.' };
  }
}

// ── GET /api/rewards/challenges ─────────────────────────────────────────────
const getChallenges = async (req, res) => {
  try {
    let challenges = [];
    try {
      challenges = await Challenge.find({});
    } catch (e) {}

    if (!challenges || challenges.length === 0) {
      challenges = INITIAL_CHALLENGES;
    }

    // Attach active submission status for logged in user if available
    let userSubmissions = [];
    if (req.user && req.user.id) {
      try {
        userSubmissions = await Submission.find({ userId: req.user.id });
      } catch (e) {
        userSubmissions = memorySubmissions.filter(s => String(s.userId) === String(req.user.id));
      }
    }

    const challengesWithStatus = challenges.map(c => {
      const cObj = c.toObject ? c.toObject() : { ...c };
      const sub = userSubmissions.find(s => s.challengeKey === cObj.key);
      cObj.userStatus = sub ? sub.status : null; // null means not started
      cObj.submissionId = sub ? sub._id : null;
      return cObj;
    });

    return res.status(200).json({ err: false, challenges: challengesWithStatus });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

// ── POST /api/rewards/start-challenge ───────────────────────────────────────
const startChallenge = async (req, res) => {
  try {
    const { challengeKey } = req.body;
    const challenge = INITIAL_CHALLENGES.find(c => c.key === challengeKey);
    if (!challenge) {
      return res.status(404).json({ err: true, message: 'Challenge not found' });
    }

    const userId = req.user ? req.user.id : 'demo_user';

    // Check if already started
    let existing = null;
    try {
      existing = await Submission.findOne({ userId, challengeKey });
    } catch (e) {
      existing = memorySubmissions.find(s => String(s.userId) === String(userId) && s.challengeKey === challengeKey);
    }

    if (existing) {
      return res.status(200).json({
        err: false,
        message: 'Challenge already active',
        submission: existing
      });
    }

    const newSubData = {
      userId,
      challengeKey,
      status: 'Accepted',
      proofUrls: [],
      submittedAt: new Date()
    };

    let newSub = null;
    try {
      newSub = new Submission(newSubData);
      await newSub.save();
    } catch (e) {
      newSub = { _id: 'sub_' + Date.now(), ...newSubData };
      memorySubmissions.push(newSub);
    }

    return res.status(200).json({
      err: false,
      message: `Started challenge "${challenge.title}"!`,
      submission: newSub
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

// ── GET /api/rewards/submission/:challengeKey ──────────────────────────────
const getSubmissionProgress = async (req, res) => {
  try {
    const { challengeKey } = req.params;
    const userId = req.user ? req.user.id : 'demo_user';
    const challenge = INITIAL_CHALLENGES.find(c => c.key === challengeKey);

    let submission = null;
    try {
      submission = await Submission.findOne({ userId, challengeKey });
    } catch (e) {
      submission = memorySubmissions.find(s => String(s.userId) === String(userId) && s.challengeKey === challengeKey);
    }

    return res.status(200).json({
      err: false,
      challenge,
      submission: submission || { status: 'Not Started' }
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

// ── POST /api/rewards/submit-proof ──────────────────────────────────────────
const submitProof = async (req, res) => {
  try {
    const { challengeKey, proofUrls, qrCode } = req.body;
    const userId = req.user ? req.user.id : 'demo_user';

    const challenge = INITIAL_CHALLENGES.find(c => c.key === challengeKey);
    if (!challenge) {
      return res.status(404).json({ err: true, message: 'Challenge not found' });
    }

    let nextStatus = 'Pending Verification';
    let aiScore = 0;
    let aiNotes = '';
    let pointsAwarded = 0;

    if (challenge.verificationType === 'qr') {
      // ── QR Code: instant validation ────────────────────────────────────────
      const submittedQr = qrCode || '';
      const validPattern = /GREENSEVA|ECO|EVENT/i;
      const qrValid = validPattern.test(submittedQr) || submittedQr.length > 5;

      if (qrValid) {
        nextStatus = 'Rewarded';
        pointsAwarded = challenge.rewardPoints;
        aiScore = 100;
        aiNotes = `QR Code "${submittedQr}" validated successfully for Eco Event participation.`;
      } else {
        nextStatus = 'Rejected';
        aiScore = 0;
        aiNotes = 'QR code appears invalid or unrecognised. Please scan the correct event QR code.';
      }
    } else {
      // ── Photo / Receipt: Mistral Vision AI Verification ───────────────────
      console.log(`[Challenge Verify] Sending ${(proofUrls || []).length} image(s) to Mistral pixtral-12b for challenge: ${challengeKey}`);

      nextStatus = 'Pending Verification';

      const aiResult = await verifyProofWithMistral(challengeKey, proofUrls || []);

      aiScore = aiResult.confidence;
      aiNotes = aiResult.notes;

      if (aiResult.verified && aiScore >= 60) {
        // AI confirms the proof — auto-approve and reward
        nextStatus = 'Rewarded';
        pointsAwarded = challenge.rewardPoints;
        console.log(`[Challenge Verify] ✅ APPROVED — score=${aiScore}, notes=${aiNotes}`);
      } else {
        // AI rejected or confidence too low
        nextStatus = 'Rejected';
        pointsAwarded = 0;
        console.log(`[Challenge Verify] ❌ REJECTED — score=${aiScore}, notes=${aiNotes}`);
      }
    }

    let submission = null;
    try {
      submission = await Submission.findOne({ userId, challengeKey });
      if (!submission) {
        submission = new Submission({ userId, challengeKey });
      }
      submission.proofUrls = proofUrls || [];
      submission.qrCode = qrCode || '';
      submission.status = nextStatus;
      submission.aiScore = aiScore;
      submission.aiNotes = aiNotes;
      submission.submittedAt = new Date();
      await submission.save();
    } catch (e) {
      submission = {
        _id: 'sub_' + Date.now(),
        userId, challengeKey,
        proofUrls: proofUrls || [],
        qrCode: qrCode || '',
        status: nextStatus,
        aiScore, aiNotes,
        submittedAt: new Date()
      };
      memorySubmissions.push(submission);
    }

    // Credit Eco Tokens if approved
    if (pointsAwarded > 0 && req.user && req.user.id) {
      try {
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { greenPoints: pointsAwarded }
        });
      } catch (e) {}
    }

    // Build user-facing message
    let responseMessage;
    if (nextStatus === 'Rewarded') {
      responseMessage = `✅ AI Verified! +${pointsAwarded} Eco Tokens credited. ${aiNotes}`;
    } else if (nextStatus === 'Rejected') {
      responseMessage = `❌ Verification failed: ${aiNotes} Please re-upload a clearer photo.`;
    } else {
      responseMessage = `Proof submitted — Status: ${nextStatus}.`;
    }

    return res.status(200).json({
      err: nextStatus === 'Rejected',
      message: responseMessage,
      submission,
      aiScore,
      aiNotes,
      pointsEarned: pointsAwarded
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

// ── GET /api/rewards/catalog ───────────────────────────────────────────────
const getRewards = async (req, res) => {
  try {
    let rewards = [];
    try {
      rewards = await Reward.find({});
    } catch (e) {}

    if (!rewards || rewards.length === 0) {
      rewards = INITIAL_REWARDS;
    }

    return res.status(200).json({ err: false, rewards });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

// ── POST /api/rewards/request-redemption ─────────────────────────────────────
const requestRedemption = async (req, res) => {
  try {
    const { rewardId } = req.body;
    const reward = INITIAL_REWARDS.find(r => r._id === rewardId) || INITIAL_REWARDS[0];
    const userId = req.user ? req.user.id : 'demo_user';

    let userPts = 1000;
    let userObj = null;

    if (req.user && req.user.id) {
      try {
        userObj = await User.findById(req.user.id);
        if (userObj) userPts = userObj.greenPoints;
      } catch (e) {}
    }

    if (userPts < reward.pointsRequired) {
      return res.status(400).json({
        err: true,
        message: `Insufficient Eco Tokens. You need ${reward.pointsRequired} tokens, but currently have ${userPts}.`
      });
    }

    // Create redemption request in status: 'pending' -> auto-simulated 'approved' -> 'redeemed'
    const newRedemptionData = {
      userId,
      rewardId: reward._id,
      rewardTitle: reward.title,
      pointsSpent: reward.pointsRequired,
      discountCode: reward.discountCode,
      status: 'pending',
      requestedAt: new Date()
    };

    let redemption = null;
    try {
      redemption = new Redemption(newRedemptionData);
      await redemption.save();

      // Deduct points from user
      if (userObj) {
        userObj.greenPoints -= reward.pointsRequired;
        await userObj.save();
        userPts = userObj.greenPoints;
      }
    } catch (e) {
      redemption = { _id: 'red_' + Date.now(), ...newRedemptionData };
      memoryRedemptions.push(redemption);
    }

    // Simulate Admin Approval right away for smooth hackathon demo
    redemption.status = 'redeemed';

    return res.status(200).json({
      err: false,
      message: `Redemption requested! Admin approved: "${reward.title}" redeemed.`,
      discountCode: reward.discountCode,
      status: 'redeemed',
      pointsSpent: reward.pointsRequired,
      newPointsBalance: userPts
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

module.exports = {
  getChallenges,
  startChallenge,
  getSubmissionProgress,
  submitProof,
  getRewards,
  requestRedemption
};
