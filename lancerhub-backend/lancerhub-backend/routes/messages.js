const express = require('express');
const router  = express.Router();
const {
  getConversations, createConversation,
  getMessages, sendMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get( '/conversations',     protect, getConversations);
router.post('/conversations',     protect, createConversation);
router.get( '/:conversationId',   protect, getMessages);
router.post('/:conversationId',   protect, sendMessage);

module.exports = router;
