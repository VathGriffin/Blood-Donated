const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { body, validationResult } = require('express-validator');
const router  = express.Router();
const BloodRequest = require('./blood-request.model');
const Inventory     = require('../inventory/inventory.model');
const { requireRole } = require('../common/middleware/require-role');

const validateRequest = [
  body('patientName').trim().notEmpty().withMessage('Patient name is required').isLength({ max: 100 }),
  body('bloodType').isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-']).withMessage('Invalid blood type'),
  body('unitsNeeded').isInt({ min: 1, max: 10 }).withMessage('Units needed must be between 1 and 10'),
  body('hospitalName').trim().notEmpty().withMessage('Hospital name is required'),
  body('urgency').isIn(['Low','Medium','High','Critical']).withMessage('Invalid urgency level'),
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `request-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});

// A hospital_staff may only act on requests assigned to their own hospital.
const assertHospitalScope = (req, request) => {
  if (!req.staff) return true;
  return request.hospital && String(request.hospital) === String(req.staff.hospitalId);
};

router.post('/', validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    res.status(201).json(await new BloodRequest(req.body).save());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/photo', requireRole('admin', 'hospital_staff'), upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!assertHospitalScope(req, request)) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: "Not your hospital's request" });
    }
    if (request.photo) {
      const old = path.join(__dirname, '../../uploads', path.basename(request.photo));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    res.json(await BloodRequest.findByIdAndUpdate(req.params.id, { photo: `/uploads/${req.file.filename}` }, { new: true }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.email) filter.userEmail = req.query.email.toLowerCase().trim();
    if (req.query.hospital) filter.hospital = req.query.hospital;
    res.json(await BloodRequest.find(filter).sort({ createdAt: -1 }).lean());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).lean();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/status', requireRole('admin', 'hospital_staff'), async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Approved', 'Rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status value' });
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!assertHospitalScope(req, request))
      return res.status(403).json({ error: "Not your hospital's request" });
    request.status = status;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fulfills an Approved request: atomically decrements the matching inventory pool
// and only then flips the request to Fulfilled. Uses a conditional filter
// (units >= unitsNeeded) instead of a multi-document transaction to stay race-safe
// on a standalone MongoDB instance (mongodb-memory-server has no replica set by default).
router.patch('/:id/fulfill', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!assertHospitalScope(req, request))
      return res.status(403).json({ error: "Not your hospital's request" });
    if (request.status !== 'Approved')
      return res.status(400).json({ error: 'Only approved requests can be fulfilled' });

    const updatedInventory = await Inventory.findOneAndUpdate(
      { bloodType: request.bloodType, hospital: request.hospital || null, units: { $gte: request.unitsNeeded } },
      { $inc: { units: -request.unitsNeeded }, lastUpdated: new Date(), updatedBy: req.auth.email },
      { new: true }
    );
    if (!updatedInventory)
      return res.status(409).json({ error: 'Insufficient inventory to fulfill this request' });

    request.status = 'Fulfilled';
    request.fulfilledAt = new Date();
    request.fulfilledBy = req.auth.id;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!assertHospitalScope(req, request))
      return res.status(403).json({ error: "Not your hospital's request" });
    const updated = await BloodRequest.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await BloodRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Request not found' });
    res.json({ message: 'Request deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
