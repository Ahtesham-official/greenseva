const foodRouter = require('express').Router();
const foodController = require('../controllers/food.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

const optionalAuth = (req, res, next) => {
  let token = req.header('Authorization');
  if (token) {
    if (token.startsWith('Bearer ')) token = token.slice(7);
    try {
      const jwt = require('jsonwebtoken');
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'greenseva_secret_key_2026');
    } catch (e) {}
  }
  next();
};

foodRouter.get('/listings', foodController.getListings);
foodRouter.post('/create', authMiddleware, foodController.createListing);
foodRouter.post('/claim/:listingId', optionalAuth, foodController.claimListing);

module.exports = foodRouter;
