const express = require('express');
const router = express.Router();
const Hospital = require('./hospital.model');
const { requireRole } = require('../common/middleware/require-role');

router.get('/', async (req, res) => {
  try {
    res.json(await Hospital.find().sort({ name: 1 }).lean());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).lean();
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
