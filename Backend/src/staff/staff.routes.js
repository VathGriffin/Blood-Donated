const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const StaffUser = require('./staff.model');
const { requireRole } = require('../common/middleware/require-role');
const { authLimiter } = require('../common/middleware/auth-limiter');
const { sendError } = require('../common/middleware/error-handler');
const { createImageUpload } = require('../common/upload');
const { sessionClaims } = require('../common/session');

const upload = createImageUpload('staff', (req) => req.auth?.id || 'unknown');

const signToken = (staff) =>
  jwt.sign(
    {
      id: staff._id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role,
      hospitalId: staff.hospital ? staff.hospital.toString() : undefined,
      ...sessionClaims(staff),
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const staffPayload = (staff) => ({
  id: staff._id,
  fullName: staff.fullName,
  email: staff.email,
  role: staff.role,
  hospitalId: staff.hospital || null,
  photo: staff.photo || null,
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const staff = await StaffUser.findOne({ email: email.toLowerCase() });
    if (!staff) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, staff.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: signToken(staff), staff: staffPayload(staff) });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Session check for the dashboard shell. The JWT proves who signed in, but the role
// and hospital it carries are frozen at login — so this re-reads the account from
// the database. A deleted account (or one whose role changed) is caught here rather
// than waiting out the 7-day token.
router.get('/me', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const staff = await StaffUser.findById(req.auth.id).select('-password').populate('hospital', 'name').lean();
    if (!staff) return res.status(401).json({ message: 'Account no longer exists' });
    res.json({
      id: staff._id,
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role,
      hospitalId: staff.hospital?._id || null,
      hospitalName: staff.hospital?.name || null,
      photo: staff.photo || null,
    });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Self-service: update the logged-in staff member's own display name.
router.patch('/me', requireRole('admin', 'hospital_staff'), async (req, res) => {
  const fullName = req.body.fullName?.trim();
  if (!fullName) return res.status(400).json({ message: 'fullName is required.' });
  try {
    const staff = await StaffUser.findByIdAndUpdate(req.auth.id, { fullName }, { new: true }).select('-password');
    if (!staff) return res.status(404).json({ message: 'Account not found' });
    res.json(staffPayload(staff));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Deletes an uploaded file by the name stored on the account. basename() keeps a
// tampered DB value from pointing outside the uploads folder.
const removeUpload = (photoPath) => {
  if (!photoPath) return;
  const file = path.join(__dirname, '../../uploads', path.basename(photoPath));
  try { fs.unlinkSync(file); } catch { /* already gone */ }
};

// Self-service: set the logged-in staff member's own profile photo (replaces the old one).
router.post('/me/photo', requireRole('admin', 'hospital_staff'), (req, res, next) => {
  upload.single('photo')(req, res, (err) => (err ? sendError(res, err, req) : next()));
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const existing = await StaffUser.findById(req.auth.id).select('photo').lean();
    if (!existing) {
      removeUpload(req.file.filename);
      return res.status(404).json({ message: 'Account not found' });
    }
    const staff = await StaffUser.findByIdAndUpdate(
      req.auth.id, { photo: `/uploads/${req.file.filename}` }, { new: true }
    ).select('-password');
    removeUpload(existing.photo);
    res.json(staffPayload(staff));
  } catch (err) {
    removeUpload(req.file?.filename);
    sendError(res, err, req);
  }
});

// Self-service: remove the logged-in staff member's own profile photo.
router.delete('/me/photo', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const existing = await StaffUser.findById(req.auth.id).select('photo').lean();
    if (!existing) return res.status(404).json({ message: 'Account not found' });
    const staff = await StaffUser.findByIdAndUpdate(req.auth.id, { photo: null }, { new: true }).select('-password');
    removeUpload(existing.photo);
    res.json(staffPayload(staff));
  } catch (err) {
    sendError(res, err, req);
  }
});

// Self-service: change the logged-in staff member's own password — requires
// proving the current one, unlike the admin-only PATCH /:id reset below.
router.patch('/me/password', requireRole('admin', 'hospital_staff'), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'currentPassword and newPassword are required.' });
  if (newPassword.length < 8)
    return res.status(400).json({ message: 'New password must be at least 8 characters.' });
  try {
    const staff = await StaffUser.findById(req.auth.id);
    if (!staff) return res.status(404).json({ message: 'Account not found' });
    const valid = await bcrypt.compare(currentPassword, staff.password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect.' });
    staff.password = await bcrypt.hash(newPassword, 10);
    await staff.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Admin-only management of hospital_staff (and other admin) accounts.
router.post('/', requireRole('admin'), async (req, res) => {
  const { fullName, email, password, role, hospital } = req.body;
  if (!fullName || !email || !password || !role)
    return res.status(400).json({ message: 'fullName, email, password and role are required.' });
  if (!['admin', 'hospital_staff'].includes(role))
    return res.status(400).json({ message: 'Invalid role.' });
  if (role === 'hospital_staff' && !hospital)
    return res.status(400).json({ message: 'hospital is required for hospital_staff accounts.' });
  try {
    const existing = await StaffUser.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email is already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const staff = await StaffUser.create({
      fullName,
      email: email.toLowerCase(),
      password: hashed,
      role,
      hospital: role === 'hospital_staff' ? hospital : null,
    });
    res.status(201).json(staffPayload(staff));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.hospital) filter.hospital = req.query.hospital;
    const staff = await StaffUser.find(filter).select('-password').populate('hospital', 'name').lean();
    res.json(staff);
  } catch (err) {
    sendError(res, err, req);
  }
});

router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const update = {};
    const { fullName, hospital } = req.body;
    if (fullName?.trim()) update.fullName = fullName.trim();
    if (hospital !== undefined) update.hospital = hospital;
    if (req.body.password) update.password = await bcrypt.hash(req.body.password, 10);
    const staff = await StaffUser.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!staff) return res.status(404).json({ message: 'Staff account not found' });
    res.json(staffPayload(staff));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const staff = await StaffUser.findByIdAndDelete(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff account not found' });
    res.json({ message: 'Staff account deleted', id: req.params.id });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
