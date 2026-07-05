const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BloodRequest = require('../models/BloodRequest');
const auth = require('../middleware/auth');

const requestStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `request-${req.params.id}-${Date.now()}${ext}`);
    },
});

const uploadRequest = multer({
    storage: requestStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// CREATE
router.post('/', async (req, res) => {
    try {
        const newRequest = new BloodRequest(req.body);
        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Upload request photo - POST /api/requests/:id/photo
router.post('/:id/photo', uploadRequest.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const request = await BloodRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.photo) {
            const oldPath = path.join(__dirname, '../uploads', path.basename(request.photo));
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        const updated = await BloodRequest.findByIdAndUpdate(
            req.params.id,
            { photo: `/uploads/${req.file.filename}` },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ ALL
router.get('/', async (req, res) => {
    try {
        const requests = await BloodRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ ONE
router.get('/:id', async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE  (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        const updated = await BloodRequest.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Request not found' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE  (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await BloodRequest.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Request not found' });
        res.json({ message: 'Request deleted', id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
