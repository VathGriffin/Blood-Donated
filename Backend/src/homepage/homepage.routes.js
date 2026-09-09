const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const HomepageProfile = require('./homepage.model');
const { requireRole } = require('../common/middleware/require-role');
const adminAuth = requireRole('admin');

const DEFAULT_PROFILES = [
  {
    name: 'Sophea Meas', role: 'First-time Donor', initials: 'SM', color: '#dc2626',
    bloodType: 'A+', donations: 3, badge: 'Active Donor', order: 0,
    bio: 'Sophea donated blood for the first time and inspired her entire workplace to join. She now volunteers at local donation drives every quarter.',
  },
  {
    name: 'Dara Keo', role: 'Grateful Parent', initials: 'DK', color: '#b91c1c',
    bloodType: 'O-', donations: 5, badge: 'Community Champion', order: 1,
    bio: 'After BloodLife connected his daughter with a life-saving donor, Dara became a passionate advocate and registered donor himself.',
  },
  {
    name: 'Dr. Chan Bopha', role: 'Cardiologist, Calmette Hospital', initials: 'CB', color: '#991b1b',
    bloodType: 'B+', donations: 12, badge: 'Medical Partner', order: 2,
    bio: 'Dr. Chan Bopha partners with BloodLife to coordinate blood drives for cardiac patients and educates the public on the importance of donation.',
  },
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename:    (req, file, cb) => cb(null, `homepage-${req.params.id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files allowed')),
});

// GET all profiles — seeds defaults on first call
router.get('/', async (req, res) => {
  try {
    let profiles = await HomepageProfile.find().sort({ order: 1 }).lean();
    if (profiles.length === 0) {
      profiles = await HomepageProfile.insertMany(DEFAULT_PROFILES);
    }
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upload photo — admin only
router.post('/:id/photo', adminAuth, upload.single('photo'), async (req, res) => {
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
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
