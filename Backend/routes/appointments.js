const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// CREATE
router.post('/', async (req, res) => {
    try {
        const appt = new Appointment(req.body);
        const saved = await appt.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// READ ALL
router.get('/', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ createdAt: -1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ ONE
router.get('/:id', async (req, res) => {
    try {
        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });
        res.json(appt);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE (status or fields)
router.put('/:id', async (req, res) => {
    try {
        const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ error: 'Appointment not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Appointment.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Appointment not found' });
        res.json({ message: 'Appointment deleted', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
