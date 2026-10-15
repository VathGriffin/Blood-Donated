const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const AboutSettings = require('./about.model');
const { requireRole } = require('../common/middleware/require-role');
const { createImageUpload } = require('../common/upload');
const { sendError } = require('../common/middleware/error-handler');
const adminAuth = requireRole('admin');

const upload = createImageUpload('about', () => 'creator');
const KEY = 'about';

// Deletes an uploaded file by its stored name. basename() keeps a tampered value inside /uploads.
const removeUpload = (photoPath) => {
  if (!photoPath) return;
  try { fs.unlinkSync(path.join(__dirname, '../../uploads', path.basename(photoPath))); } catch { /* already gone */ }
};

const payload = (settings) => ({ creatorPhoto: settings?.creatorPhoto || null });

// GET the About page settings — public, read by the About page
router.get('/', async (req, res) => {
  try {
    res.json(payload(await AboutSettings.findOne({ key: KEY }).lean()));
  } catch (err) {
    sendError(res, err, req);
  }
});

// POST upload the creator portrait for "The Builders Behind It" — admin only. Replaces the old one.
router.post('/creator-photo', adminAuth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => (err ? sendError(res, err, req) : next()));
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const previous = await AboutSettings.findOneAndUpdate(
      { key: KEY }, { creatorPhoto: `/uploads/${req.file.filename}` }, { upsert: true, new: false }
    ).lean();
    removeUpload(previous?.creatorPhoto);
    res.json({ creatorPhoto: `/uploads/${req.file.filename}` });
  } catch (err) {
    removeUpload(req.file?.filename);
    sendError(res, err, req);
  }
});

// DELETE the creator portrait — admin only. The About page falls back to the creator's initials.
router.delete('/creator-photo', adminAuth, async (req, res) => {
  try {
    const previous = await AboutSettings.findOneAndUpdate({ key: KEY }, { creatorPhoto: null }, { new: false }).lean();
    removeUpload(previous?.creatorPhoto);
    res.json({ creatorPhoto: null });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
