const userRouter = require('express').Router();
const userController = require('../controllers/user.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

userRouter.get('/profile', authMiddleware, userController.getProfile);
userRouter.get('/dashboard-stats', authMiddleware, userController.getDashboardStats);
userRouter.put('/profile', authMiddleware, userController.updateProfile);

module.exports = userRouter;
