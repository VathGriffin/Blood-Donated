const express = require('express');
const router = express.Router();
const ContactMessage = require('./contact-message.model');
const adminAuth = require('../common/middleware/admin-auth');

router.post('/', async (req, res) => {
  try {
    res.status(201).json(await new ContactMessage(req.body).save());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    res.json(await ContactMessage.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', adminAuth, async (req, res) => {
  try {
    const msg = await ContactMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    res.json(await ContactMessage.findByIdAndUpdate(req.params.id, req.body, { new: true }));
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
