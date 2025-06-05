const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');

// CREATE
router.post('/register', async (req, res) => {
  try {
    const donor = new Donor(req.body);
    const savedDonor = await donor.save();
    res.status(201).json(savedDonor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const updatedDonor = await Donor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedDonor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Donor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Donor not found' });
    res.json({ message: 'Donor deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
