const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware'); // Fixed path to match actual filename

router.post('/', auth, chatController.handleChat);

module.exports = router;
