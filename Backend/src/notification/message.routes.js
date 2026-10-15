const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Message = require('./message.model');
const { requireRole } = require('../common/middleware/require-role');
const { sendError } = require('../common/middleware/error-handler');
const userAuth = requireRole('donor');
const adminAuth = requireRole('admin');

// Chat messages are short notes, not documents. A cap keeps one request from storing megabytes of
// text (the JSON body limit alone is 1 MB). Content is rendered as plain text, never as HTML.
const MAX_MESSAGE_LENGTH = 2000;
const tooLong = (content) => content.trim().length > MAX_MESSAGE_LENGTH;

// What a reader is allowed to see of a message. A soft-deleted message keeps its place (and time)
// in the conversation but loses its text, and internal fields never leave the server. `mine` tells
// the admin UI which replies the signed-in admin wrote (and so may delete).
const present = (msg, viewerAdminId = null) => {
  const { senderId, deletedBy, ...rest } = msg;
  const out = { ...rest, deleted: !!msg.deletedAt };
  if (out.deleted) out.content = '';
  if (viewerAdminId) out.mine = msg.sender === 'admin' && !!senderId && String(senderId) === String(viewerAdminId);
  return out;
};

router.post('/', userAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: 'Message cannot be empty.' });
  if (tooLong(content))
    return res.status(400).json({ message: `Messages can be at most ${MAX_MESSAGE_LENGTH} characters.` });
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
    const list = await Message.find({ userId: req.user.id }).sort({ createdAt: 1 }).lean();
    res.json(list.map((m) => present(m)));
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
          lastMessage: { $first: { $cond: [{ $ifNull: ['$deletedAt', false] }, '', '$content'] } },
          lastDeleted: { $first: { $cond: [{ $ifNull: ['$deletedAt', false] }, true, false] } },
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
    if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ message: 'Invalid conversation id' });
    const messages = await Message.find({ userId: req.params.userId }).sort({ createdAt: 1 }).lean();
    res.json(messages.map((m) => present(m, req.admin.id)));
    Message.updateMany({ userId: req.params.userId, sender: 'user', read: false }, { $set: { read: true } })
      .catch((err) => console.error('Failed to mark messages as read:', err.message));
  } catch (err) {
    sendError(res, err, req);
  }
});

router.post('/reply/:userId', adminAuth, async (req, res) => {
  const { content, userName, userEmail } = req.body;
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ message: 'Invalid conversation id' });
  if (!content?.trim()) return res.status(400).json({ message: 'Reply cannot be empty.' });
  if (tooLong(content))
    return res.status(400).json({ message: `Replies can be at most ${MAX_MESSAGE_LENGTH} characters.` });
  try {
    const msg = await Message.create({
      userId: req.params.userId,
      userName,
      userEmail,
      content: content.trim(),
      sender: 'admin',
      senderId: req.admin.id,
      read: true,
    });
    res.status(201).json(present(msg.toObject(), req.admin.id));
  } catch (err) {
    sendError(res, err, req);
  }
});

// An admin deletes one of their OWN replies in one conversation (soft delete). Ownership is the
// stable StaffUser id stored when the reply was sent — never a display name. Donor messages and
// other admins' replies can't be deleted here. The update is atomic and only matches a message
// that is in this conversation, sent by this admin and not yet deleted, so double clicks and
// races are safe; a repeat on an already-deleted message answers 200 with alreadyDeleted.
router.delete('/conversation/:userId/:messageId', adminAuth, async (req, res) => {
  const { userId, messageId } = req.params;
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(messageId))
    return res.status(400).json({ message: 'Invalid conversation or message id' });
  try {
    const now = new Date();
    const updated = await Message.findOneAndUpdate(
      { _id: messageId, userId, sender: 'admin', senderId: req.admin.id, deletedAt: null },
      { $set: { deletedAt: now, deletedBy: req.admin.id } },
      { new: true }
    ).lean();
    if (updated) return res.json(present(updated, req.admin.id));

    // Nothing matched: work out why, without touching anything.
    const existing = await Message.findById(messageId).select('userId sender senderId deletedAt').lean();
    if (!existing || String(existing.userId) !== String(userId))
      return res.status(404).json({ message: 'Message not found in this conversation' });
    if (existing.sender !== 'admin')
      return res.status(403).json({ message: "Administrators can't delete donor messages." });
    if (!existing.senderId || String(existing.senderId) !== String(req.admin.id))
      return res.status(403).json({ message: 'You can only delete replies you sent yourself.' });
    // It is this admin's own reply, so it must already be deleted.
    const full = await Message.findById(messageId).lean();
    return res.json({ ...present(full, req.admin.id), alreadyDeleted: true });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
module.exports.MAX_MESSAGE_LENGTH = MAX_MESSAGE_LENGTH;
