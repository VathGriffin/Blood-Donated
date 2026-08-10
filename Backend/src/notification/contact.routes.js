const express = require('express');
const router = express.Router();
const ContactMessage = require('./contact-message.model');
const adminAuth = require('../common/middleware/admin-auth');

router.post('/', async (req, res) => {
  const { fullName, email, message } = req.body;
  if (!fullName?.trim() || !email?.trim() || !message?.trim())
    return res.status(400).json({ error: 'All fields are required.' });
  try {
    res.status(201).json(
      await new ContactMessage({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
      }).save()
    );
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    res.json(await ContactMessage.find().sort({ createdAt: -1 }).lean());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', adminAuth, async (req, res) => {
  try {
    const msg = await ContactMessage.findById(req.params.id).lean();
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    res.json(await ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Message not found' });
    res.json({ message: 'Message deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
