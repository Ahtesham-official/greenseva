const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'https://greenseva-git-main-ahteshamofficial357-4057s-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));


const authRouter = require('./src/Routers/auth.route.js');
const userRouter = require('./src/Routers/user.route.js');
const cosmeticRouter = require('./src/Routers/cosmetic.route.js');
const foodRouter = require('./src/Routers/food.route.js');
const rewardsRouter = require('./src/Routers/rewards.route.js');
const contactRouter = require('./src/Routers/contact.route.js');

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/cosmetic', cosmeticRouter);
app.use('/api/food', foodRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/contact', contactRouter);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'GreenSeva API Backend is live!' });
});

module.exports = app;
