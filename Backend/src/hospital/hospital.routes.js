const express = require('express');
const router = express.Router();
const Hospital = require('./hospital.model');
const { requireRole, optionalAuth } = require('../common/middleware/require-role');
const { sendError } = require('../common/middleware/error-handler');

// The hospital directory is public (the booking page lists centers from it), but only its
// directory fields: contact email, licence number and timestamps are for admins.
const PUBLIC_FIELDS = 'name address city phone location';
const visibleFields = (req) => (req.admin ? '' : PUBLIC_FIELDS); // '' = every field

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
    const updated = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Hospital not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Hospital.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Hospital not found' });
    res.json({ message: 'Hospital deleted', id: req.params.id });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
