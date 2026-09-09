const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const StaffUser = require('./staff.model');
const { requireRole } = require('../common/middleware/require-role');

const signToken = (staff) =>
  jwt.sign(
    {
      id: staff._id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role,
      hospitalId: staff.hospital ? staff.hospital.toString() : undefined,
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
});

router.post('/login', async (req, res) => {
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
