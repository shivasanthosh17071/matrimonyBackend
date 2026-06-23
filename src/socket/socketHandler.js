// File: src/socket/socketHandler.js
const { verifyAccessToken } = require('../utils/jwt');
const User    = require('../models/User');
const Message = require('../models/Message');
const Interest = require('../models/Interest');
const logger  = require('../utils/logger');

const initializeSocket = (io) => {

  // ── JWT auth middleware ────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      if (!decoded)  return next(new Error('Invalid or expired token'));
      const user = await User.findById(decoded.id).select('_id displayName plan isActive isSuspended');
      if (!user || !user.isActive || user.isSuspended) return next(new Error('Account not accessible'));
      socket.userId = user._id.toString();
      socket.user   = user;
      next();
    } catch (e) { next(new Error('Socket auth failed')); }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: user=${userId} id=${socket.id}`);

    await User.findByIdAndUpdate(userId, { isOnline: true, socketId: socket.id, lastSeen: new Date() });
    socket.join(`user_${userId}`);
    socket.broadcast.emit('user_online', { userId });

    // ── Send Message ───────────────────────────────────
    socket.on('send_message', async ({ receiverId, content }, cb) => {
      try {
        if (!content?.trim() || !receiverId) return cb?.({ error: 'Invalid data' });
        if (!['gold','diamond'].includes(socket.user.plan)) return cb?.({ error: 'Chat requires Gold plan or higher' });

        const interest = await Interest.findOne({
          $or: [
            { sender: userId, receiver: receiverId, status: 'accepted' },
            { sender: receiverId, receiver: userId, status: 'accepted' },
          ],
        });
        if (!interest) return cb?.({ error: 'Accept each other\'s interest before chatting' });

        const conversationId = Message.getConversationId(userId, receiverId);
        const message = await Message.create({
          conversationId, sender: userId, receiver: receiverId,
          content: content.trim().slice(0, 2000),
        });
        await message.populate('sender', 'displayName');

        io.to(`user_${receiverId}`).emit('new_message', {
          _id: message._id, conversationId,
          sender: { _id: userId, displayName: socket.user.displayName },
          content: message.content, createdAt: message.createdAt, isRead: false,
        });
        cb?.({ success: true, message });
      } catch (e) { logger.error(`Socket send_message: ${e.message}`); cb?.({ error: 'Failed to send' }); }
    });

    // ── Typing indicators ──────────────────────────────
    socket.on('typing_start', ({ receiverId }) => io.to(`user_${receiverId}`).emit('user_typing', { userId, typing: true }));
    socket.on('typing_stop',  ({ receiverId }) => io.to(`user_${receiverId}`).emit('user_typing', { userId, typing: false }));

    // ── Mark messages read ─────────────────────────────
    socket.on('mark_read', async ({ conversationId }) => {
      await Message.updateMany(
        { conversationId, receiver: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
      const otherId = conversationId.split('_').find(id => id !== userId);
      io.to(`user_${otherId}`).emit('messages_read', { conversationId, readBy: userId });
    });

    // ── Disconnect ─────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: user=${userId}`);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date(), socketId: null });
      socket.broadcast.emit('user_offline', { userId, lastSeen: new Date() });
    });

    socket.on('ping', (cb) => typeof cb === 'function' && cb({ status: 'pong', time: Date.now() }));
  });

  logger.info('Socket.IO initialized ✓');
};

module.exports = initializeSocket;
