const express = require('express');
const { body, validationResult } = require('express-validator');
const router   = express.Router();
const Inventory = require('./inventory.model');
const adminAuth = require('../common/middleware/admin-auth');

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEFAULTS = BLOOD_TYPES.map((t, i) => ({
  bloodType: t,
  units: [45, 12, 28, 8, 62, 18, 74, 22][i],
  minUnits: 10,
  maxUnits: 200,
}));

// GET all — seeds defaults on first call
router.get('/', async (req, res) => {
  try {
    let items = await Inventory.find().sort({ bloodType: 1 }).lean({ virtuals: true });
    if (items.length < BLOOD_TYPES.length) {
      const existing = items.map(i => i.bloodType);
      const missing  = DEFAULTS.filter(d => !existing.includes(d.bloodType));
      if (missing.length) await Inventory.insertMany(missing);
      items = await Inventory.find().sort({ bloodType: 1 }).lean({ virtuals: true });
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET summary stats
router.get('/stats', async (req, res) => {
  try {
    const items = await Inventory.find().lean({ virtuals: true });
    const total    = items.reduce((s, i) => s + i.units, 0);
    const critical = items.filter(i => i.status === 'critical' || i.status === 'empty').length;
    const adequate = items.filter(i => i.status === 'adequate').length;
    res.json({ total, critical, adequate, types: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update units — admin only
router.put('/:bloodType',
  adminAuth,
  body('units').isInt({ min: 0 }).withMessage('Units must be a non-negative integer'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const updated = await Inventory.findOneAndUpdate(
        { bloodType: req.params.bloodType },
        { units: req.body.units, lastUpdated: new Date(), updatedBy: req.admin?.email || 'admin' },
        { new: true, upsert: true, runValidators: true }
      );
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// PATCH adjust (add/subtract)
router.patch('/:bloodType/adjust',
  adminAuth,
  body('delta').isInt().withMessage('Delta must be an integer'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const item = await Inventory.findOne({ bloodType: req.params.bloodType });
      if (!item) return res.status(404).json({ message: 'Blood type not found' });
      item.units = Math.max(0, item.units + req.body.delta);
      item.lastUpdated = new Date();
      item.updatedBy = req.admin?.email || 'admin';
      await item.save();
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

module.exports = router;
