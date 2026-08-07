const User = require('../DB/User.schema.js');
const CosmeticScan = require('../DB/CosmeticScan.schema.js');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ err: true, message: 'User not found' });
    }
    return res.status(200).json({ err: false, user });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ err: true, message: 'User not found' });
    }

    // Fetch last 5 cosmetic scans for activity feed
    let recentScans = [];
    try {
      recentScans = await CosmeticScan.find({ userId: req.user.id })
        .sort({ scannedAt: -1 })
        .limit(5)
        .select('productName ecoScore safetyRating scannedAt');
    } catch (e) {}

    // Build activity feed from scan history
    const activityFeed = recentScans.map(scan => ({
      type: 'scan',
      icon: 'qr_code_scanner',
      title: `Scanned: ${scan.productName}`,
      subtitle: `Eco Score: ${scan.ecoScore}/100 · ${scan.safetyRating}`,
      points: '+20 pts',
      time: formatTimeAgo(scan.scannedAt),
    }));

    // Compute level info based on green points
    const pts = user.greenPoints || 0;
    const { level, nextLevelPts, ptsToNext } = computeLevel(pts);

    // Carbon ring: % of 30kg monthly CO2 goal
    const co2 = user.co2SavedKg || 0;
    const co2Goal = 30;
    const co2Percent = Math.min(100, Math.round((co2 / co2Goal) * 100));
    const co2Dashoffset = Math.round(282.7 - (co2Percent / 100) * 282.7);

    return res.status(200).json({
      err: false,
      stats: {
        name: user.name,
        greenPoints: user.greenPoints,
        co2SavedKg: user.co2SavedKg,
        itemsRescued: user.itemsRescued,
        scanCount: user.scanCount,
        streakDays: user.streakDays,
        co2Percent,
        co2Dashoffset,
        co2Goal,
        level,
        nextLevelPts,
        ptsToNext,
        activityFeed,
        avatar: user.avatar,
      }
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

function computeLevel(pts) {
  const levels = [
    { name: 'Eco Seedling', min: 0, max: 249 },
    { name: 'Green Sprout', min: 250, max: 499 },
    { name: 'Eco Warrior', min: 500, max: 999 },
    { name: 'Earth Guardian', min: 1000, max: 1999 },
    { name: 'Planet Champion', min: 2000, max: Infinity },
  ];
  let level = levels[0];
  for (const l of levels) {
    if (pts >= l.min) level = l;
  }
  const nextLevelPts = level.max === Infinity ? null : level.max + 1;
  const ptsToNext = nextLevelPts ? nextLevelPts - pts : null;
  return { level: level.name, nextLevelPts, ptsToNext };
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address, city, state, pincode },
      { new: true }
    ).select('-password');
    return res.status(200).json({ err: false, message: 'Profile updated successfully', user });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

module.exports = { getProfile, getDashboardStats, updateProfile };
