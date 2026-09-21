const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const HomepageProfile = require('./homepage.model');
const { requireRole } = require('../common/middleware/require-role');
const { createImageUpload } = require('../common/upload');
const { sendError } = require('../common/middleware/error-handler');
const adminAuth = requireRole('admin');

// The frontend's offline FALLBACK_PROFILES (app/(public)/page.jsx) use these same photos — keep them in
// step, otherwise the cards change from photos to initials the moment the backend is running.
const DEFAULT_PROFILES = [
  {
    name: 'Sophea Meas', role: 'First-time Donor', initials: 'SM', color: '#dc2626',
    photo: 'https://i.pravatar.cc/640?img=47', bloodType: 'A+', donations: 3, badge: 'Active Donor', order: 0,
    bio: 'Sophea donated blood for the first time and inspired her entire workplace to join. She now volunteers at local donation drives every quarter.',
  },
  {
    name: 'Dara Keo', role: 'Grateful Parent', initials: 'DK', color: '#b91c1c',
    photo: 'https://i.pravatar.cc/640?img=68', bloodType: 'O-', donations: 5, badge: 'Community Champion', order: 1,
    bio: 'After BloodLife connected his daughter with a life-saving donor, Dara became a passionate advocate and registered donor himself.',
  },
  {
    name: 'Dr. Chan Bopha', role: 'Cardiologist, Calmette Hospital', initials: 'CB', color: '#991b1b',
    photo: 'https://i.pravatar.cc/640?img=32', bloodType: 'B+', donations: 12, badge: 'Medical Partner', order: 2,
    bio: 'Dr. Chan Bopha partners with BloodLife to coordinate blood drives for cardiac patients and educates the public on the importance of donation.',
  },
];

const upload = createImageUpload('homepage');

// GET all profiles — seeds defaults on first call
router.get('/', async (req, res) => {
  try {
    let profiles = await HomepageProfile.find().sort({ order: 1 }).lean();
    if (profiles.length === 0) {
      profiles = await HomepageProfile.insertMany(DEFAULT_PROFILES);
    }
    res.json(profiles);
  } catch (err) {
    sendError(res, err, req);
  }
});

// POST create profile — admin only
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, role, bloodType, bio, donations, badge, color } = req.body;
    if (!name?.trim() || !role?.trim())
      return res.status(400).json({ message: 'Name and role are required' });

    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const order = await HomepageProfile.countDocuments();
    const profile = await new HomepageProfile({
      name: name.trim(),
      role: role.trim(),
      initials,
      color: color || '#dc2626',
      bloodType: bloodType || '',
      bio: bio || '',
      donations: donations || 0,
      badge: badge || '',
      order,
    }).save();
    res.status(201).json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE profile — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const profile = await HomepageProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.photo && !profile.photo.startsWith('http')) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(profile.photo));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await HomepageProfile.findByIdAndDelete(req.params.id);
    res.json({ message: 'Profile deleted', id: req.params.id });
  } catch (err) {
    sendError(res, err, req);
  }
});

// POST upload photo — admin only
router.post('/:id/photo', adminAuth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const profile = await HomepageProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    // Delete old local file if any
    if (profile.photo && !profile.photo.startsWith('http')) {
      const old = path.join(__dirname, '../../uploads', path.basename(profile.photo));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    const updated = await HomepageProfile.findByIdAndUpdate(
      req.params.id,
      { photo: `/uploads/${req.file.filename}` },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    sendError(res, err, req);
  }
});

// DELETE photo — admin only
router.delete('/:id/photo', adminAuth, async (req, res) => {
  try {
    const profile = await HomepageProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    if (profile.photo && !profile.photo.startsWith('http')) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(profile.photo));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    const updated = await HomepageProfile.findByIdAndUpdate(req.params.id, { photo: null }, { new: true });
    res.json(updated);
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
