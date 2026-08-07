const contactRouter = require('express').Router();
const contactController = require('../controllers/contact.controller.js');

contactRouter.post('/', contactController.submitContact);

module.exports = contactRouter;
