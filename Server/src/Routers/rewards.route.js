const rewardsRouter = require('express').Router();
const rewardsController = require('../controllers/rewards.controller.js');

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

rewardsRouter.get('/challenges', optionalAuth, rewardsController.getChallenges);
rewardsRouter.post('/start-challenge', optionalAuth, rewardsController.startChallenge);
rewardsRouter.get('/submission/:challengeKey', optionalAuth, rewardsController.getSubmissionProgress);
rewardsRouter.post('/submit-proof', optionalAuth, rewardsController.submitProof);

rewardsRouter.get('/catalog', rewardsController.getRewards);
rewardsRouter.post('/claim', optionalAuth, rewardsController.requestRedemption);

module.exports = rewardsRouter;
