const cosmeticRouter = require('express').Router();
const cosmeticController = require('../controllers/cosmetic.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

// Optional auth for scan endpoint so anonymous users can scan too
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

cosmeticRouter.post('/scan', optionalAuth, cosmeticController.scanCosmetic);
cosmeticRouter.get('/history', authMiddleware, cosmeticController.getScanHistory);

module.exports = cosmeticRouter;
