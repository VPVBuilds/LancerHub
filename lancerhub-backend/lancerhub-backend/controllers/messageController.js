const { Conversation, Message } = require('../models/Message');

// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'name avatar title lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/messages/conversations
// @access  Private
exports.createConversation = async (req, res, next) => {
  try {
    const { recipientId, jobId } = req.body;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
      ...(jobId && { job: jobId }),
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
        job: jobId || null,
      });
    }

    await conversation.populate('participants', 'name avatar title');
    res.status(201).json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
};

// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find({ conversation: req.params.conversationId, isDeleted: false })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })  // newest first, client reverses for display
      .skip(skip)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.user.id }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count for this user
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      [`unreadCount.${req.user.id}`]: 0,
    });

    res.json({ success: true, messages: messages.reverse(), page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/messages/:conversationId
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (!conversation.participants.map(String).includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }

    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user.id,
      content: req.body.content,
      type: req.body.type || 'text',
    });

    await message.populate('sender', 'name avatar');

    // Update conversation lastMessage
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      // Increment unread for all other participants
      ...Object.fromEntries(
        conversation.participants
          .filter((p) => p.toString() !== req.user.id)
          .map((p) => [`unreadCount.${p}`, (conversation.unreadCount?.get(p.toString()) || 0) + 1])
      ),
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};
