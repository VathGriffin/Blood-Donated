const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { body, validationResult } = require('express-validator');
const router  = express.Router();
const BloodRequest = require('./blood-request.model');
const Inventory     = require('../inventory/inventory.model');
const { requireRole, optionalAuth } = require('../common/middleware/require-role');
const { BLOOD_TYPES } = require('../common/blood-types');
const { assertHospitalScope } = require('../common/middleware/assert-hospital-scope');
const { createImageUpload } = require('../common/upload');
const { sendError } = require('../common/middleware/error-handler');

const validateRequest = [
  body('patientName').trim().notEmpty().withMessage('Patient name is required').isLength({ max: 100 }),
  body('bloodType').isIn(BLOOD_TYPES).withMessage('Invalid blood type'),
  body('unitsNeeded').isInt({ min: 1, max: 10 }).withMessage('Units needed must be between 1 and 10'),
  body('hospitalName').trim().notEmpty().withMessage('Hospital name is required'),
  body('urgency').isIn(['Low','Medium','High','Critical']).withMessage('Invalid urgency level'),
];

const upload = createImageUpload('request');

// Anyone may submit a request, but only these fields are read from the body — never status,
// fulfilledAt/By, photo or the hospital link, which a visitor could otherwise set to "Fulfilled".
// userEmail (what ties a request to a donor's profile) comes from the login token, not the client,
// so nobody can file requests into someone else's profile.
const REQUEST_FIELDS = ['hospitalName', 'patientName', 'bloodType', 'unitsNeeded', 'urgency', 'reason', 'contact'];

router.post('/', optionalAuth, validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const data = Object.fromEntries(REQUEST_FIELDS.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
    data.userEmail = req.user?.email || '';
    res.status(201).json(await new BloodRequest(data).save());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/photo', requireRole('admin', 'hospital_staff'), (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
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
    sendError(res, err, req);
  }
});

// Blood requests carry patient names, reasons and contact details, so reading them needs a login,
// scoped to what that account may see (same rules as appointments):
//   admin - everything (optionally filtered by ?hospital= / ?email=)
//   hospital_staff - their own hospital's requests only
//   donor - the requests filed under their own account email
// A filter outside the caller's scope is refused; someone else's single request is a 404.
const readRequests = requireRole('admin', 'hospital_staff', 'donor');

const canRead = (req, request) => {
  if (req.admin) return true;
  if (req.staff) return assertHospitalScope(req, request);
  return !!req.user?.email && request.userEmail === req.user.email.toLowerCase();
};

router.get('/', readRequests, async (req, res) => {
  try {
    const filter = {};
    if (req.staff) {
      if (!req.staff.hospitalId) return res.status(403).json({ error: 'Your account is not linked to a hospital' });
      if (req.query.hospital && String(req.query.hospital) !== String(req.staff.hospitalId))
        return res.status(403).json({ error: "Not your hospital's requests" });
      filter.hospital = req.staff.hospitalId;
    } else if (req.user) {
      const own = req.user.email.toLowerCase();
      if (req.query.email && String(req.query.email).toLowerCase().trim() !== own)
        return res.status(403).json({ error: 'You can only view your own requests' });
      if (req.query.hospital) return res.status(403).json({ error: 'Not allowed' });
      filter.userEmail = own;
    } else {
      if (req.query.email) filter.userEmail = String(req.query.email).toLowerCase().trim();
      if (req.query.hospital) filter.hospital = req.query.hospital;
    }
    res.json(await BloodRequest.find(filter).sort({ createdAt: -1 }).lean());
  } catch (err) {
    sendError(res, err, req);
  }
});

router.get('/:id', readRequests, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).lean();
    if (!request || !canRead(req, request)) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    sendError(res, err, req);
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
    sendError(res, err, req);
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
    sendError(res, err, req);
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
    sendError(res, err, req);
  }
});

module.exports = router;
