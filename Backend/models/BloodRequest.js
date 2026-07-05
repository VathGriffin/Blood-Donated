const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
    {
        hospitalName: { type: String, required: true },
        patientName: { type: String, required: true },
        bloodType: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            required: true,
        },
        urgency: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        reason: { type: String, required: true },
        contact: { type: String, required: true },
        photo: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
