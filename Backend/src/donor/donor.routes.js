const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Donor = require('./donor.model');
const adminAuth = require('../common/middleware/admin-auth');

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
    res.json(await Donor.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
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

router.delete('/:id/photo', adminAuth, async (req, res) => {
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

router.delete('/:id', adminAuth, async (req, res) => {
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
