const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const User = require('./user.model');
const { requireRole } = require('../common/middleware/require-role');
const { createImageUpload } = require('../common/upload');
const { authLimiter } = require('../common/middleware/auth-limiter');
const { sendError } = require('../common/middleware/error-handler');
const { BLOOD_TYPES } = require('../common/blood-types');
const userAuth = requireRole('donor');

const upload = createImageUpload('user', (req) => req.user?.id || 'unknown');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, fullName: user.fullName, role: 'donor' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const userPayload = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  photo: user.photo || null,
  phone: user.phone || '',
  bloodType: user.bloodType || '',
  location: user.location || '',
  dateOfBirth: user.dateOfBirth || null,
});

// Optional profile fields collected at sign-up. Returns { value } or { error }.
function parseSignupProfile({ phone, dateOfBirth, bloodType, location }) {
  const value = {};
  if (phone) {
    const cleaned = String(phone).trim();
    if (!/^\+?[0-9 ()-]{8,20}$/.test(cleaned)) return { error: 'Please enter a valid phone number.' };
    value.phone = cleaned;
  }
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    const oldest = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    if (Number.isNaN(dob.getTime()) || dob > now || dob < oldest)
      return { error: 'Please enter a valid date of birth.' };
    value.dateOfBirth = dob;
  }
  if (bloodType) {
    if (!BLOOD_TYPES.includes(bloodType)) return { error: 'Please choose a valid blood type.' };
    value.bloodType = bloodType;
  }
  if (location) value.location = String(location).trim().slice(0, 100);
  return { value };
}

router.post('/register', authLimiter, async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  const profile = parseSignupProfile(req.body);
  if (profile.error) return res.status(400).json({ message: profile.error });
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email is already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email: email.toLowerCase(), password: hashed, ...profile.value });
    res.status(201).json({ token: signToken(user), user: userPayload(user) });
  } catch (err) {
    sendError(res, err, req);
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    if (!user.password)
      return res.status(401).json({ message: 'This account uses social login. Please sign in with Google or Facebook.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: signToken(user), user: userPayload(user) });
  } catch (err) {
    sendError(res, err, req);
  }
});

router.post('/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Access token required.' });
  try {
    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const { sub: googleId, email, name } = profile;
    if (!email) return res.status(400).json({ message: 'Could not retrieve email from Google.' });
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
    } else {
      user = await User.create({ fullName: name, email: email.toLowerCase(), googleId });
    }
    res.json({ token: signToken(user), user: userPayload(user) });
  } catch (err) {
    console.error('Google auth error:', err.response?.data || err.message);
    res.status(401).json({ message: 'Google authentication failed.' });
  }
});

router.post('/facebook', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ message: 'Access token required.' });
  try {
    const { data: profile } = await axios.get('https://graph.facebook.com/me', {
      params: { fields: 'id,name,email', access_token: accessToken },
    });
    const { id: facebookId, name, email } = profile;
    if (!email) return res.status(400).json({ message: 'Email permission is required. Please allow email access on Facebook.' });
    let user = await User.findOne({ $or: [{ facebookId }, { email: email.toLowerCase() }] });
    if (user) {
      if (!user.facebookId) { user.facebookId = facebookId; await user.save(); }
    } else {
      user = await User.create({ fullName: name, email: email.toLowerCase(), facebookId });
    }
    res.json({ token: signToken(user), user: userPayload(user) });
  } catch (err) {
    console.error('Facebook auth error:', err.response?.data || err.message);
    res.status(401).json({ message: 'Facebook authentication failed.' });
  }
});

// ── Authenticated user endpoints ──

router.get('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(userPayload(user));
  } catch (err) {
    sendError(res, err, req);
  }
});

router.put('/profile', userAuth, async (req, res) => {
  const { fullName, phone } = req.body;
  try {
    const update = {};
    if (fullName?.trim()) update.fullName = fullName.trim();
    if (phone !== undefined) update.phone = String(phone).trim();
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(userPayload(user));
  } catch (err) {
    sendError(res, err, req);
  }
});

router.post('/photo', userAuth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const existing = await User.findById(req.user.id).select('photo').lean();
    if (existing?.photo) {
      const oldPath = path.join(__dirname, '../../uploads', path.basename(existing.photo));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { photo: `/uploads/${req.file.filename}` },
      { new: true }
    ).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(userPayload(user));
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
