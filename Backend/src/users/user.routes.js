const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();
const User = require('./user.model');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, fullName: user.fullName, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const userPayload = (user) => ({ id: user._id, fullName: user.fullName, email: user.email });

router.post('/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email is already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email: email.toLowerCase(), password: hashed });
    res.status(201).json({ token: signToken(user), user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
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
    res.status(500).json({ message: err.message });
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

module.exports = router;
