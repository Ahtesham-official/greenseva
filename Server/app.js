const express = require('express');
const cors = require('cors');

const app = express();

// Allow ANY URL / Origin to access the backend completely
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
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
