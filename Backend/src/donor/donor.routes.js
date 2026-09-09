const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Donor = require('./donor.model');
const { requireRole } = require('../common/middleware/require-role');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `donor-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
});

// Whole-blood donation eligibility interval, in days.
const ELIGIBILITY_INTERVAL_DAYS = 56;

const computeEligibility = (lastDonation) => {
  if (!lastDonation) return { eligible: true, daysSinceLastDonation: null, nextEligibleDate: null };
  const days = Math.floor((Date.now() - new Date(lastDonation).getTime()) / 86400000);
  const eligible = days >= ELIGIBILITY_INTERVAL_DAYS;
  return {
    eligible,
    daysSinceLastDonation: days,
    nextEligibleDate: eligible
      ? null
      : new Date(new Date(lastDonation).getTime() + ELIGIBILITY_INTERVAL_DAYS * 86400000).toISOString(),
  };
};

router.post('/', async (req, res) => {
  try {
    const donor = await new Donor(req.body).save();
    res.status(201).json(donor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    res.json(await Donor.find().sort({ createdAt: -1 }).lean());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/lookup', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const donor = await Donor.findOne({ email: email.toLowerCase().trim() })
      .select('fullName bloodType available lastDonation location')
      .lean();
    if (!donor) return res.json({ found: false });
    res.json({ found: true, ...donor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).lean();
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Issues a signed, opaque token embedding only a donor id — the QR code encodes this,
// never raw claims, so nothing about a scan can be forged client-side.
router.get('/:id/qr-token', requireRole('donor'), async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).lean();
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    if (donor.email.toLowerCase() !== req.user.email.toLowerCase())
      return res.status(403).json({ message: 'You can only generate a QR code for your own donor profile.' });
    const token = jwt.sign(
      { sub: donor._id, email: donor.email, type: 'donor_qr' },
      process.env.QR_JWT_SECRET,
      { expiresIn: '180d' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Staff-only: scans a donor QR token and returns the donor's live record — never
// trusts anything from the QR payload beyond the id it was signed with.
router.post('/verify-qr', requireRole('admin', 'hospital_staff'), async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'token is required' });
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.QR_JWT_SECRET);
  } catch (err) {
    const reason = err.name === 'TokenExpiredError' ? 'expired' : 'invalid';
    return res.status(400).json({ valid: false, reason });
  }
  if (decoded.type !== 'donor_qr')
    return res.status(400).json({ valid: false, reason: 'invalid' });
  try {
    const donor = await Donor.findById(decoded.sub).lean();
    if (!donor) return res.status(404).json({ valid: false, reason: 'not_found' });
    res.json({
      valid: true,
      donor: {
        id: donor._id,
        fullName: donor.fullName,
        email: donor.email,
        phone: donor.phone,
        bloodType: donor.bloodType,
        location: donor.location,
        available: donor.available,
        lastDonation: donor.lastDonation,
        donationCount: donor.donationCount,
        photo: donor.photo || null,
      },
      eligibility: computeEligibility(donor.lastDonation),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const updated = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    if (donor.photo) {
      const old = path.join(__dirname, '../../uploads', path.basename(donor.photo));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    res.json(await Donor.findByIdAndUpdate(req.params.id, { photo: `/uploads/${req.file.filename}` }, { new: true }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/photo', requireRole('admin'), async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    if (donor.photo) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(donor.photo));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json(await Donor.findByIdAndUpdate(req.params.id, { photo: null }, { new: true }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    if (donor.photo) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(donor.photo));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ message: 'Donor deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
