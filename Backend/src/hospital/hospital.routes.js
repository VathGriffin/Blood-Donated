const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Hospital = require('./hospital.model');
const { requireRole, optionalAuth } = require('../common/middleware/require-role');
const { createImageUpload } = require('../common/upload');
const { sendError } = require('../common/middleware/error-handler');

const upload = createImageUpload('hospital');

// The hospital directory is public (the booking page lists centers from it), but only its
// directory fields: contact email, licence number and timestamps are for admins.
const PUBLIC_FIELDS = 'name address city phone location image';
const visibleFields = (req) => (req.admin ? '' : PUBLIC_FIELDS); // '' = every field

// Removes a previously uploaded image file; external URLs aren't ours to delete.
const removeLocalImage = (image) => {
  if (!image || !image.startsWith('/uploads/')) return;
  const file = path.join(__dirname, '../../uploads', path.basename(image));
  if (fs.existsSync(file)) fs.unlinkSync(file);
};

router.get('/', optionalAuth, async (req, res) => {
  try {
    res.json(await Hospital.find().select(visibleFields(req)).sort({ name: 1 }).lean());
  } catch (err) {
    sendError(res, err, req);
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).select(visibleFields(req)).lean();
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    sendError(res, err, req);
  }
});

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    res.status(201).json(await new Hospital(req.body).save());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const before = await Hospital.findById(req.params.id).select('image').lean();
    if (!before) return res.status(404).json({ message: 'Hospital not found' });
    const updated = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Hospital not found' });
    if (before.image !== updated.image) removeLocalImage(before.image); // replaced by a URL or cleared
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Hospital.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Hospital not found' });
    removeLocalImage(deleted.image);
    res.json({ message: 'Hospital deleted', id: req.params.id });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Upload (or replace) the hospital's photo — admin only. Field name: "image".
router.post('/:id/image', requireRole('admin'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(err.status || 400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Hospital not found' });
    }
    removeLocalImage(hospital.image);
    hospital.image = `/uploads/${req.file.filename}`;
    res.json(await hospital.save());
  } catch (err) {
    sendError(res, err, req);
  }
});

router.delete('/:id/image', requireRole('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    removeLocalImage(hospital.image);
    hospital.image = '';
    res.json(await hospital.save());
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
