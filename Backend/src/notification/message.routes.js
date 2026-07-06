const express = require('express');
const router = express.Router();
const Message = require('./message.model');
const userAuth = require('../common/middleware/user-auth');
const adminAuth = require('../common/middleware/admin-auth');

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
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', userAuth, async (req, res) => {
  try {
    res.json(await Message.find({ userId: req.user.id }).sort({ createdAt: 1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

router.get('/conversation/:userId', adminAuth, async (req, res) => {
  try {
    const messages = await Message.find({ userId: req.params.userId }).sort({ createdAt: 1 });
    await Message.updateMany({ userId: req.params.userId, sender: 'user', read: false }, { $set: { read: true } });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
