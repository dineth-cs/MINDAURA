const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

router.post('/', auth, chatController.handleChat);

module.exports = router;
