const mongoose = require('mongoose');
const { BLOOD_TYPES } = require('../common/blood-types');

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    patientName: { type: String, required: true },
    bloodType: { type: String, enum: BLOOD_TYPES, required: true },
    unitsNeeded: { type: Number, min: 1, max: 10, default: 1 },
    urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled'], default: 'Pending' },
    reason: { type: String, required: true },
    contact:   { type: String, default: '' },
    userEmail: { type: String, default: '', lowercase: true, trim: true },
    photo: { type: String, default: null },
    fulfilledAt: { type: Date, default: null },
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', default: null },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ status: 1, urgency: 1 });
bloodRequestSchema.index({ bloodType: 1 });
bloodRequestSchema.index({ createdAt: -1 });
bloodRequestSchema.index({ userEmail: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
