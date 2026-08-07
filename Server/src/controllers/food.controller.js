const FoodRescue = require('../DB/FoodRescue.schema.js');
const User = require('../DB/User.schema.js');

// Seed / Initial Food Rescue Listings if DB is empty
const initialListings = [
  {
    _id: '1',
    title: 'Surplus Fresh South Indian Meal Box',
    providerName: 'Annapoorna Caterers',
    category: 'Meals',
    description: 'Hot vegetarian thali including steamed rice, sambar, vada, and organic chutney. Prepared fresh today.',
    originalPrice: 180,
    discountedPrice: 50,
    quantityAvailable: 5,
    location: 'Indiranagar, Bengaluru (1.2 km away)',
    expiresInHours: 3,
    imageUrl: 'southfood.jpg',
  },
  {
    _id: '2',
    title: 'Organic Fresh Fruit Basket',
    providerName: 'Green Farm Market',
    category: 'Produce',
    description: 'Assorted seasonal fruits including apples, bananas, and sweet oranges.',
    originalPrice: 250,
    discountedPrice: 80,
    quantityAvailable: 3,
    location: 'Koramangala, Bengaluru (2.5 km away)',
    expiresInHours: 5,
    imageUrl: 'fruitsontable.jpg',
  },
  {
    _id: '3',
    title: 'Deluxe Healthy Thali Platter',
    providerName: 'Seva Community Kitchen',
    category: 'Meals',
    description: 'Balanced wholesome thali with roti, dal, sabzi, and salad. Surplus from afternoon catering event.',
    originalPrice: 200,
    discountedPrice: 60,
    quantityAvailable: 8,
    location: 'Jayanagar, Bengaluru (3.0 km away)',
    expiresInHours: 2,
    imageUrl: 'foodthali.jpg',
  }
];

let memoryListings = [...initialListings];

const getListings = async (req, res) => {
  try {
    const { category } = req.query;
    let listings = [];
    try {
      let query = {};
      if (category && category !== 'All') {
        query.category = category;
      }
      listings = await FoodRescue.find(query).sort({ createdAt: -1 });
    } catch (e) {}

    if (!listings || listings.length === 0) {
      listings = memoryListings;
      if (category && category !== 'All') {
        listings = listings.filter(l => l.category === category);
      }
    }

    return res.status(200).json({ err: false, listings });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

const createListing = async (req, res) => {
  try {
    const { title, providerName, category, description, originalPrice, discountedPrice, quantityAvailable, location, expiresInHours } = req.body;
    if (!title || !providerName) {
      return res.status(400).json({ err: true, message: 'Title and provider name are required.' });
    }

    const newListingData = {
      title,
      providerName,
      category: category || 'Meals',
      description: description || 'Fresh leftover food ready for rescue.',
      originalPrice: Number(originalPrice) || 150,
      discountedPrice: Number(discountedPrice) || 40,
      quantityAvailable: Number(quantityAvailable) || 1,
      location: location || 'Local Area',
      expiresInHours: Number(expiresInHours) || 4,
      imageUrl: 'foodthali.jpg',
    };

    try {
      const dbListing = new FoodRescue(newListingData);
      await dbListing.save();
    } catch (e) {
      newListingData._id = String(Date.now());
      memoryListings.unshift(newListingData);
    }

    // Award NGO/User +50 Green Points for posting surplus food
    if (req.user && req.user.id) {
      try {
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { greenPoints: 50, co2SavedKg: 2.0 }
        });
      } catch (e) {}
    }

    return res.status(201).json({
      err: false,
      message: 'Surplus food item listed successfully! +50 Green Points awarded.',
      listing: newListingData,
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

const claimListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    let listingFound = null;

    try {
      listingFound = await FoodRescue.findById(listingId);
      if (listingFound && listingFound.quantityAvailable > 0) {
        listingFound.quantityAvailable -= 1;
        if (req.user && req.user.id) {
          listingFound.claimedBy.push({ userId: req.user.id });
        }
        await listingFound.save();
      }
    } catch (e) {}

    if (!listingFound) {
      const idx = memoryListings.findIndex(l => String(l._id) === String(listingId));
      if (idx !== -1 && memoryListings[idx].quantityAvailable > 0) {
        memoryListings[idx].quantityAvailable -= 1;
        listingFound = memoryListings[idx];
      }
    }

    // Award +30 Green Points and update rescued count
    let updatedPoints = 280;
    if (req.user && req.user.id) {
      try {
        const updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          { $inc: { greenPoints: 30, itemsRescued: 1, co2SavedKg: 1.5 } },
          { new: true }
        );
        if (updatedUser) updatedPoints = updatedUser.greenPoints;
      } catch (e) {}
    }

    return res.status(200).json({
      err: false,
      message: 'Food item claimed successfully! +30 Green Points earned for rescuing food.',
      pointsEarned: 30,
      newPointsBalance: updatedPoints,
      item: listingFound,
    });
  } catch (err) {
    return res.status(500).json({ err: true, message: err.message });
  }
};

module.exports = { getListings, createListing, claimListing };
