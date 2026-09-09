const express = require('express');
const { body, validationResult } = require('express-validator');
const router   = express.Router();
const Inventory = require('./inventory.model');
const { requireRole } = require('../common/middleware/require-role');

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DEFAULTS = BLOOD_TYPES.map((t, i) => ({
  bloodType: t,
  hospital: null,
  units: [45, 12, 28, 8, 62, 18, 74, 22][i],
  minUnits: 10,
  maxUnits: 200,
}));

// GET all — seeds the central-pool (hospital: null) defaults on first call.
// ?hospital=<id> scopes to one hospital; hospital_staff default to their own hospital.
router.get('/', async (req, res) => {
  try {
    const hospitalId = req.query.hospital || null;

    if (!hospitalId) {
      let items = await Inventory.find({ hospital: null }).sort({ bloodType: 1 }).lean({ virtuals: true });
      if (items.length < BLOOD_TYPES.length) {
        const existing = items.map(i => i.bloodType);
        const missing  = DEFAULTS.filter(d => !existing.includes(d.bloodType));
        if (missing.length) await Inventory.insertMany(missing);
        items = await Inventory.find({ hospital: null }).sort({ bloodType: 1 }).lean({ virtuals: true });
      }
      return res.json(items);
    }

    const items = await Inventory.find({ hospital: hospitalId }).sort({ bloodType: 1 }).lean({ virtuals: true });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET summary stats (central pool)
router.get('/stats', async (req, res) => {
  try {
    const items = await Inventory.find({ hospital: null }).lean({ virtuals: true });
    const total    = items.reduce((s, i) => s + i.units, 0);
    const critical = items.filter(i => i.status === 'critical' || i.status === 'empty').length;
    const adequate = items.filter(i => i.status === 'adequate').length;
    res.json({ total, critical, adequate, types: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update units — admin (any pool) or hospital_staff (their own hospital only)
router.put('/:bloodType',
  requireRole('admin', 'hospital_staff'),
  body('units').isInt({ min: 0 }).withMessage('Units must be a non-negative integer'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const hospital = req.staff ? req.staff.hospitalId : (req.body.hospital || null);
      const updated = await Inventory.findOneAndUpdate(
        { bloodType: req.params.bloodType, hospital: hospital || null },
        { units: req.body.units, lastUpdated: new Date(), updatedBy: req.admin?.email || req.staff?.email || 'admin' },
        { new: true, upsert: true, runValidators: true }
      );
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// PATCH adjust (add/subtract) — admin (any pool) or hospital_staff (their own hospital only)
router.patch('/:bloodType/adjust',
  requireRole('admin', 'hospital_staff'),
  body('delta').isInt().withMessage('Delta must be an integer'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const hospital = req.staff ? req.staff.hospitalId : (req.body.hospital || null);
      const item = await Inventory.findOne({ bloodType: req.params.bloodType, hospital: hospital || null });
      if (!item) return res.status(404).json({ message: 'Blood type not found' });
      item.units = Math.max(0, item.units + req.body.delta);
      item.lastUpdated = new Date();
      item.updatedBy = req.admin?.email || req.staff?.email || 'admin';
      await item.save();
      res.json(item);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

module.exports = router;
