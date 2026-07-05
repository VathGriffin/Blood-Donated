const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
