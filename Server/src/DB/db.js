const mongoose = require('mongoose');
const FoodRescue = require('./FoodRescue.schema.js');
const Reward = require('./Reward.schema.js');

const initialFoodItems = [
  {
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

const initialRewards = [
  {
    title: '₹200 Off Organic Grocery Voucher',
    partner: 'GreenGrocers Co.',
    pointsRequired: 150,
    discountCode: 'GREENORGANIC200',
    description: 'Get ₹200 off your next order of certified organic fruits & vegetables.',
    category: 'Shopping',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    expiryDays: 30,
  },
  {
    title: 'Free Plant & Seed Starter Kit',
    partner: 'EcoFlora Nurseries',
    pointsRequired: 200,
    discountCode: 'SEEDLINGFREE',
    description: 'Claim a free indoor medicinal plant seedling and compost starter pack.',
    category: 'Gardening',
    imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=400&q=80',
    expiryDays: 45,
  },
  {
    title: 'Plant a Real Tree in Your Name',
    partner: 'GreenSeva Forest Initiative',
    pointsRequired: 300,
    discountCode: 'TREEPASSPORT',
    description: 'Sponsor a tree sapling planted in urban reforestation zones with a digital certificate.',
    category: 'Eco Impact',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80',
    expiryDays: 90,
  },
  {
    title: '15% Off Zero-Waste Bamboo Products',
    partner: 'BambooBazaar',
    pointsRequired: 100,
    discountCode: 'BAMBOOSAVE15',
    description: 'Save 15% on reusable bamboo cutlery, toothbrushes, and stainless steel bottles.',
    category: 'Shopping',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
    expiryDays: 30,
  }
];

const seedDatabase = async () => {
  try {
    const foodCount = await FoodRescue.countDocuments();
    if (foodCount === 0) {
      await FoodRescue.insertMany(initialFoodItems);
      console.log('MongoDB Seed: Initial Food Rescue items seeded successfully.');
    }

    const rewardCount = await Reward.countDocuments();
    if (rewardCount === 0) {
      await Reward.insertMany(initialRewards);
      console.log('MongoDB Seed: Initial Reward Vouchers seeded successfully.');
    }
  } catch (err) {
    console.warn('MongoDB Seed warning:', err.message);
  }
};

const connectDB = async () => {
  try {
    let connStr = process.env.MONGODB_URI;

    if (!connStr && process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
      // Build MongoDB Atlas URI if username and password are provided
      connStr = `mongodb+srv://${process.env.MONGODB_USERNAME}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@cluster0.mongodb.net/greenseva?retryWrites=true&w=majority`;
    }

    if (!connStr) {
      connStr = 'mongodb://127.0.0.1:27017/greenseva';
    }

    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000 // Quick timeout if remote/local DB is offline
    });

    console.log(`MongoDB Connected successfully to database: greenseva`);
    await seedDatabase();
  } catch (error) {
    console.warn(`MongoDB Primary Connection Notice: ${error.message}. Attempting local database fallback...`);
    try {
      const fallbackUrl = 'mongodb://127.0.0.1:27017/greenseva';
      await mongoose.connect(fallbackUrl);
      console.log(`MongoDB Connected successfully to local database`);
      await seedDatabase();
    } catch (fallbackError) {
      console.warn(`Local MongoDB Notice: ${fallbackError.message}. Backend running with active Mongoose schemas.`);
    }
  }
};

module.exports = connectDB;
