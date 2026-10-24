const express = require('express');
const mongoose = require('mongoose');
const path    = require('path');
const fs      = require('fs');
const { body, validationResult } = require('express-validator');
const router  = express.Router();
const BloodRequest = require('./blood-request.model');
const Inventory     = require('../inventory/inventory.model');
const Hospital      = require('../hospital/hospital.model');
const { requireRole, optionalAuth } = require('../common/middleware/require-role');
const { BLOOD_TYPES, BLOOD_COMPONENTS } = require('../common/blood-types');
const { assertHospitalScope } = require('../common/middleware/assert-hospital-scope');
const { createImageUpload } = require('../common/upload');
const { sendError } = require('../common/middleware/error-handler');
const { findHospitalIdByName } = require('./link-hospital');

const DAY_MS = 86400000;
// A little slack so a "now" picked on a slightly slow clock isn't rejected as being in the past.
const PAST_SLACK_MS = 5 * 60 * 1000;
const MAX_REQUIRED_BY_DAYS = 365;

const validateRequest = [
  body('patientName').trim().notEmpty().withMessage('Patient name is required')
    .isLength({ max: 100 }).withMessage('Patient name must be at most 100 characters'),
  body('patientAge').optional({ values: 'null' })
    .isInt({ min: 0, max: 120 }).withMessage('Patient age must be a whole number from 0 to 120').toInt(),
  body('bloodType').isIn(BLOOD_TYPES).withMessage('Invalid blood type'),
  body('component').optional({ values: 'null' }).isIn(BLOOD_COMPONENTS).withMessage('Invalid blood component'),
  body('unitsNeeded').isInt({ min: 1, max: 10 }).withMessage('Units needed must be between 1 and 10'),
  // A registered hospital is picked by id; older clients (and the admin form) still send a name only.
  body('hospitalId').optional({ values: 'null' }).isMongoId().withMessage('Invalid hospital'),
  body('hospitalName').if((_, { req }) => !req.body.hospitalId)
    .trim().notEmpty().withMessage('Hospital name is required')
    .isLength({ max: 150 }).withMessage('Hospital name is too long'),
  body('urgency').isIn(['Low','Medium','High','Critical']).withMessage('Invalid urgency level'),
  body('requiredBy').optional({ values: 'null' })
    .isISO8601().withMessage('Required-by date is not a valid date')
    .bail()
    .custom((value) => {
      const t = new Date(value).getTime();
      if (t < Date.now() - PAST_SLACK_MS) throw new Error('Required-by date cannot be in the past');
      if (t > Date.now() + MAX_REQUIRED_BY_DAYS * DAY_MS) throw new Error('Required-by date must be within the next year');
      return true;
    }),
  body('reason').trim().notEmpty().withMessage('Reason is required')
    .isLength({ max: 1000 }).withMessage('Reason must be at most 1000 characters'),
  body('contact').optional({ values: 'null' }).isString().withMessage('Contact must be text')
    .trim().isLength({ max: 100 }).withMessage('Contact must be at most 100 characters'),
];

// The same signed-in requester sending the same patient, blood type and hospital again within this
// window is almost certainly a double submit (double click, retry after a slow response, two tabs).
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const upload = createImageUpload('request');

// Anyone may submit a request, but only these fields are read from the body — never status,
// fulfilledAt/By, photo or the hospital link, which a visitor could otherwise set to "Fulfilled".
// userEmail (what ties a request to a donor's profile) comes from the login token, not the client,
// so nobody can file requests into someone else's profile.
// Submitting a request never touches inventory or donor records: stock is only deducted when
// hospital staff fulfil an approved request (PATCH /:id/fulfill).
const REQUEST_FIELDS = [
  'hospitalName', 'patientName', 'patientAge', 'bloodType', 'component', 'unitsNeeded', 'urgency', 'requiredBy', 'reason', 'contact',
];

router.post('/', optionalAuth, validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  try {
    const data = Object.fromEntries(REQUEST_FIELDS.filter((key) => req.body[key] != null).map((key) => [key, req.body[key]]));
    data.userEmail = req.user?.email?.toLowerCase() || '';

    // Link to the registered hospital so it shows up on that hospital's staff dashboard. A picked
    // hospital id must exist, and its stored name wins over whatever name the client sent.
    if (req.body.hospitalId) {
      const hospital = await Hospital.findById(req.body.hospitalId).select('_id name').lean();
      if (!hospital) return res.status(400).json({ message: 'The selected hospital is not registered on BloodLife.' });
      data.hospital = hospital._id;
      data.hospitalName = hospital.name;
    } else {
      data.hospital = await findHospitalIdByName(data.hospitalName);
    }

    if (data.userEmail) {
      const duplicate = await BloodRequest.findOne({
        userEmail: data.userEmail,
        status: 'Pending',
        bloodType: data.bloodType,
        hospitalName: new RegExp(`^${escapeRegex(data.hospitalName.trim())}$`, 'i'),
        patientName: new RegExp(`^\\s*${escapeRegex(String(data.patientName).trim())}\\s*$`, 'i'),
        createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      }).select('_id').lean();
      if (duplicate) {
        return res.status(409).json({
          message: 'You already sent this request a few minutes ago. It is waiting for the hospital to review it.',
          duplicateOf: duplicate._id,
        });
      }
    }

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
      fs.rmSync(req.file.path, { force: true }); // already gone is fine — don't turn a 401/403 into a 500
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

// The requester withdraws their own request. Only a Pending request can be cancelled: once it is
// approved the hospital is already acting on it, so the donor contacts them instead. Ownership and
// status are checked in the same atomic update, so a double-click or two tabs can't cancel twice
// and a request approved a moment earlier is never flipped to Cancelled.
router.patch('/:id/cancel', requireRole('donor'), async (req, res) => {
  const { reason = '' } = req.body || {};
  if (typeof reason !== 'string' || reason.trim().length > 500)
    return res.status(400).json({ error: 'Cancellation reason must be text of at most 500 characters.' });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Request not found' });
  try {
    const own = req.user.email.toLowerCase();
    const cancelled = await BloodRequest.findOneAndUpdate(
      { _id: req.params.id, userEmail: own, status: 'Pending' },
      { $set: { status: 'Cancelled', cancelledAt: new Date(), cancellationReason: reason.trim() } },
      { new: true, runValidators: true }
    );
    if (cancelled) return res.json(cancelled);

    // Nothing matched: say why, without revealing other people's requests (those are a 404).
    const existing = await BloodRequest.findById(req.params.id).select('userEmail status').lean();
    if (!existing || existing.userEmail !== own) return res.status(404).json({ error: 'Request not found' });
    const why = {
      Cancelled: 'This request has already been cancelled.',
      Approved: 'This request has already been approved, so it can no longer be cancelled here. Please contact the hospital or send us a message.',
    }[existing.status] || `A ${existing.status.toLowerCase()} request can't be cancelled.`;
    res.status(409).json({ error: why, status: existing.status });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Staff may move a request between Pending, Approved and Rejected. Cancelled (withdrawn by the
// requester) and Fulfilled (stock already deducted) are final: reopening a fulfilled request would
// let it be fulfilled — and deducted — a second time.
const STAFF_STATUSES = ['Pending', 'Approved', 'Rejected'];
const FINAL_STATUS_ERROR = {
  Cancelled: 'This request was cancelled by the requester.',
  Fulfilled: 'This request has already been fulfilled and can no longer change status.',
};

router.patch('/:id/status', requireRole('admin', 'hospital_staff'), async (req, res) => {
  const { status } = req.body;
  if (!STAFF_STATUSES.includes(status))
    return res.status(400).json({ error: 'Invalid status value' });
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!assertHospitalScope(req, request))
      return res.status(403).json({ error: "Not your hospital's request" });
    if (FINAL_STATUS_ERROR[request.status])
      return res.status(409).json({ error: FINAL_STATUS_ERROR[request.status] });
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
    const changes = { ...req.body };
    // Fields that only the workflow itself may set: who filed it, fulfilment (which deducts stock,
    // see /fulfill) and cancellation (the requester's own action).
    for (const key of ['_id', 'userEmail', 'fulfilledAt', 'fulfilledBy', 'cancelledAt', 'cancellationReason', 'createdAt', 'updatedAt'])
      delete changes[key];
    // The admin page approves/rejects through this route, so it follows the same status rules.
    if (changes.status !== undefined && changes.status !== request.status) {
      if (!STAFF_STATUSES.includes(changes.status))
        return res.status(400).json({ error: 'Invalid status value' });
      if (FINAL_STATUS_ERROR[request.status])
        return res.status(409).json({ error: FINAL_STATUS_ERROR[request.status] });
    }
    // Renaming the hospital moves the request to that hospital's dashboard (admins only — staff
    // keep their own hospital's requests, so a rename can't push a request out of their scope).
    delete changes.hospital;
    if (typeof changes.hospitalName === 'string' && !req.staff)
      changes.hospital = await findHospitalIdByName(changes.hospitalName);
    const updated = await BloodRequest.findByIdAndUpdate(req.params.id, { $set: changes }, { new: true, runValidators: true });
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
