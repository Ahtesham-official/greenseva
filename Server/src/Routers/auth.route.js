const authRouter = require('express').Router();
const authController = require('../controllers/auth.controller.js');
const authMiddleware = require('../middleware/auth.middleware.js');

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/me', authMiddleware, authController.getMe);
authRouter.post('/logout', authController.logout);

module.exports = authRouter;