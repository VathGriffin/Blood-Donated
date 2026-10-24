const express = require('express');
const { body, validationResult } = require('express-validator');
const router   = express.Router();
const Inventory = require('./inventory.model');
const { requireRole } = require('../common/middleware/require-role');
const { BLOOD_TYPES } = require('../common/blood-types');
const { stockStatus } = require('../common/stock-status');
const { sendError } = require('../common/middleware/error-handler');

// The central pool starts empty — every unit shown anywhere must be one somebody recorded.
const DEFAULTS = BLOOD_TYPES.map((t) => ({
  bloodType: t,
  hospital: null,
  units: 0,
  minUnits: 10,
  maxUnits: 200,
}));

// Real stock across the whole network: central pool + every hospital, one row per blood type.
// A type nobody has recorded comes back as 0 units (empty) rather than being left out.
async function networkStock() {
  const groups = await Inventory.aggregate([
    { $group: { _id: '$bloodType', units: { $sum: '$units' }, minUnits: { $sum: '$minUnits' }, pools: { $sum: 1 }, lastUpdated: { $max: '$lastUpdated' } } },
  ]);
  const byType = Object.fromEntries(groups.map((g) => [g._id, g]));
  return BLOOD_TYPES.map((bloodType) => {
    const g = byType[bloodType];
    const units = g?.units || 0;
    const minUnits = g?.minUnits || 10;
    return { bloodType, units, minUnits, pools: g?.pools || 0, lastUpdated: g?.lastUpdated || null, status: stockStatus(units, minUnits) };
  });
}

// NOTE: these queries deliberately don't use .lean(). `status` is a schema virtual, and
// lean() skips virtuals ( `.lean({ virtuals: true })` needs the mongoose-lean-virtuals
// plugin, which isn't installed) — so the API silently returned no `status` at all.
// Hydrated docs serialise with virtuals via the schema's toJSON setting.

// GET all — seeds the central-pool (hospital: null) defaults on first call.
// ?hospital=<id> scopes to one hospital; hospital_staff default to their own hospital.
router.get('/', async (req, res) => {
  try {
    const hospitalId = req.query.hospital || null;

    if (!hospitalId) {
      let items = await Inventory.find({ hospital: null }).sort({ bloodType: 1 });
      if (items.length < BLOOD_TYPES.length) {
        const existing = items.map(i => i.bloodType);
        const missing  = DEFAULTS.filter(d => !existing.includes(d.bloodType));
        if (missing.length) await Inventory.insertMany(missing);
        items = await Inventory.find({ hospital: null }).sort({ bloodType: 1 });
      }
      return res.json(items);
    }

    const items = await Inventory.find({ hospital: hospitalId }).sort({ bloodType: 1 });
    res.json(items);
  } catch (err) {
    sendError(res, err, req);
  }
});

// GET network-wide stock per blood type (central pool + all hospitals) — the admin overview.
router.get('/network', async (req, res) => {
  try {
    res.json(await networkStock());
  } catch (err) {
    sendError(res, err, req);
  }
});

// GET summary stats, network-wide
router.get('/stats', async (req, res) => {
  try {
    const items = await networkStock();
    const total    = items.reduce((s, i) => s + i.units, 0);
    const critical = items.filter(i => i.status === 'critical' || i.status === 'empty').length;
    const adequate = items.filter(i => i.status === 'adequate').length;
    res.json({ total, critical, adequate, types: items.length });
  } catch (err) {
    sendError(res, err, req);
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
      // A hospital starts with no rows, and the UI's "+" is how it begins tracking a blood
      // type — so a missing row is created (like PUT does) instead of returning 404.
      const item = await Inventory.findOne({ bloodType: req.params.bloodType, hospital: hospital || null })
        || new Inventory({ bloodType: req.params.bloodType, hospital: hospital || null, units: 0 });
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
