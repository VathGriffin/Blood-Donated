const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const AboutSettings = require('./about.model');
const { sanitizeSections, LIMITS } = require('./about.sections');
const { requireRole } = require('../common/middleware/require-role');
const { createImageUpload } = require('../common/upload');
const { sendError } = require('../common/middleware/error-handler');
const adminAuth = requireRole('admin');

const KEY = 'about';

// Image slots on the page → the field that stores each one.
const IMAGE_FIELDS = { creator: 'creatorPhoto', hero: 'heroImage', purpose: 'purposeImage' };

const upload = createImageUpload('about', (req) => req.params.slot);

// Deletes an uploaded file by its stored name. basename() keeps a tampered value inside /uploads.
const removeUpload = (photoPath) => {
  if (!photoPath) return;
  try { fs.unlinkSync(path.join(__dirname, '../../uploads', path.basename(photoPath))); } catch { /* already gone */ }
};

const payload = (settings) => ({
  creatorPhoto: settings?.creatorPhoto || null,
  heroImage:    settings?.heroImage || null,
  purposeImage: settings?.purposeImage || null,
  sections:     settings?.sections || {},
  limits:       LIMITS,
});

// Rejects an unknown :slot before multer writes anything to disk.
const checkSlot = (req, res, next) => {
  if (!IMAGE_FIELDS[req.params.slot]) return res.status(404).json({ message: 'Unknown image slot' });
  next();
};

// GET the About page settings — public, read by the About page
router.get('/', async (req, res) => {
  try {
    res.json(payload(await AboutSettings.findOne({ key: KEY }).lean()));
  } catch (err) {
    sendError(res, err, req);
  }
});

// PUT the page text — admin only. Replaces all sections with the (sanitized) body.sections.
router.put('/', adminAuth, async (req, res) => {
  try {
    const sections = sanitizeSections(req.body.sections);
    const saved = await AboutSettings.findOneAndUpdate(
      { key: KEY }, { sections }, { upsert: true, new: true }
    ).lean();
    res.json(payload(saved));
  } catch (err) {
    sendError(res, err, req);
  }
});

// POST an image for a slot — admin only. Replaces (and deletes) the old one.
router.post('/images/:slot', adminAuth, checkSlot, (req, res, next) => {
  upload.single('photo')(req, res, (err) => (err ? sendError(res, err, req) : next()));
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const field = IMAGE_FIELDS[req.params.slot];
    const url = `/uploads/${req.file.filename}`;
    const previous = await AboutSettings.findOneAndUpdate(
      { key: KEY }, { [field]: url }, { upsert: true, new: false }
    ).lean();
    removeUpload(previous?.[field]);
    res.json({ [field]: url });
  } catch (err) {
    removeUpload(req.file?.filename);
    sendError(res, err, req);
  }
});

// DELETE a slot's image — admin only. The page falls back to its built-in image (or initials).
router.delete('/images/:slot', adminAuth, checkSlot, async (req, res) => {
  try {
    const field = IMAGE_FIELDS[req.params.slot];
    const previous = await AboutSettings.findOneAndUpdate({ key: KEY }, { [field]: null }, { new: false }).lean();
    removeUpload(previous?.[field]);
    res.json({ [field]: null });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
