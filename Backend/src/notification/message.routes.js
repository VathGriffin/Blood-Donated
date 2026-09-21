const express = require('express');
const router = express.Router();
const Message = require('./message.model');
const { requireRole } = require('../common/middleware/require-role');
const { sendError } = require('../common/middleware/error-handler');
const userAuth = requireRole('donor');
const adminAuth = requireRole('admin');

router.post('/', userAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'Message cannot be empty.' });
  try {
    const msg = await Message.create({
      userId: req.user.id,
      userName: req.user.fullName,
      userEmail: req.user.email,
      content: content.trim(),
      sender: 'user',
    });
    res.status(201).json(msg);
  } catch (err) {
    sendError(res, err, req);
  }
});

router.get('/mine', userAuth, async (req, res) => {
  try {
    res.json(await Message.find({ userId: req.user.id }).sort({ createdAt: 1 }).lean());
  } catch (err) {
    sendError(res, err, req);
  }
});

// A donor may only delete their own sent messages, never the admin's replies.
router.delete('/:id', userAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.userId) !== String(req.user.id) || msg.sender !== 'user')
      return res.status(403).json({ message: 'You can only delete your own messages' });
    await msg.deleteOne();
    res.json({ message: 'Message deleted', id: req.params.id });
  } catch (err) {
    sendError(res, err, req);
  }
});

router.get('/conversations', adminAuth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          userName: { $first: '$userName' },
          userEmail: { $first: '$userEmail' },
          lastMessage: { $first: '$content' },
          lastSender: { $first: '$sender' },
          lastAt: { $first: '$createdAt' },
          unread: { $sum: { $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$read', false] }] }, 1, 0] } },
        },
      },
      { $sort: { lastAt: -1 } },
    ]);
    res.json(conversations);
  } catch (err) {
    sendError(res, err, req);
  }
});

router.get('/conversation/:userId', adminAuth, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.params.userId }).sort({ createdAt: 1 }).lean();
    res.json(messages);
    Message.updateMany({ userId: req.params.userId, sender: 'user', read: false }, { $set: { read: true } })
      .catch((err) => console.error('Failed to mark messages as read:', err.message));
  } catch (err) {
    sendError(res, err, req);
  }
});

router.post('/reply/:userId', adminAuth, async (req, res) => {
  const { content, userName, userEmail } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'Reply cannot be empty.' });
  try {
    const msg = await Message.create({
      userId: req.params.userId,
      userName,
      userEmail,
      content: content.trim(),
      sender: 'admin',
      read: true,
    });
    res.status(201).json(msg);
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
