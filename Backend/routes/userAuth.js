const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Email is already registered.' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ fullName, email: email.toLowerCase(), password: hashed });
        const token = jwt.sign(
            { id: user._id, email: user.email, fullName: user.fullName, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.status(201).json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

        const token = jwt.sign(
            { id: user._id, email: user.email, fullName: user.fullName, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
