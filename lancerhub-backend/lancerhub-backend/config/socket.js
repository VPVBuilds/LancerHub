const jwt = require('jsonwebtoken');

// Map userId -> socketId for targeted messaging
const onlineUsers = new Map();

const initSocket = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    console.log(`🟢 User connected: ${userId}`);

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId });

    // ── Join a conversation room ──────────────
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId);
    });

    // ── Send a message ────────────────────────
    socket.on('message:send', async (data) => {
      const { conversationId, message } = data;
      // Emit to everyone in the conversation room (including sender for confirmation)
      io.to(conversationId).emit('message:receive', {
        conversationId,
        message,
        timestamp: new Date(),
      });
    });

    // ── Typing indicator ──────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', { userId });
    });
    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', { userId });
    });

    // ── Notifications ─────────────────────────
    socket.on('notification:read', (notifId) => {
      // handled in controller, socket just acknowledges
    });

    // ── Disconnect ────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
      console.log(`🔴 User disconnected: ${userId}`);
    });
  });
};

// Send a targeted notification to a specific user
const notifyUser = (io, userId, event, data) => {
  const socketId = onlineUsers.get(userId?.toString());
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

module.exports = { initSocket, notifyUser, onlineUsers };
