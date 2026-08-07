const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, required: true },
    patientName: { type: String, required: true },
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
    unitsNeeded: { type: Number, min: 1, max: 10, default: 1 },
    urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    reason: { type: String, required: true },
    contact:   { type: String, default: '' },
    userEmail: { type: String, default: '' },
    photo: { type: String, default: null },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ status: 1, urgency: 1 });
bloodRequestSchema.index({ bloodType: 1 });
bloodRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
