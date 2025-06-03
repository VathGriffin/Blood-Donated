const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    hospitalName: { type: String, required: true },
    patientName: { type: String, required: true },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true
    },
    reason: { type: String, required: true },
    contact: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
