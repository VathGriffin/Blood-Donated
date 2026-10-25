const mongoose = require('mongoose');
const { BLOOD_TYPES, BLOOD_COMPONENTS } = require('../common/blood-types');

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    patientName: { type: String, required: true },
    // Optional: older requests have none, and the admin form doesn't ask for it.
    patientAge: { type: Number, min: 0, max: 120, default: null },
    bloodType: { type: String, enum: BLOOD_TYPES, required: true },
    component: { type: String, enum: BLOOD_COMPONENTS, default: 'Whole Blood' },
    unitsNeeded: { type: Number, min: 1, max: 10, default: 1 },
    urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    // When the patient needs the blood by (optional).
    requiredBy: { type: Date, default: null },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled'], default: 'Pending' },
    reason: { type: String, required: true },
    contact:   { type: String, default: '' },
    userEmail: { type: String, default: '', lowercase: true, trim: true },
    photo: { type: String, default: null },
    fulfilledAt: { type: Date, default: null },
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', default: null },
    // Set when the requester withdraws a still-pending request (PATCH /:id/cancel).
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ status: 1, urgency: 1 });
bloodRequestSchema.index({ bloodType: 1 });
bloodRequestSchema.index({ createdAt: -1 });
// A donor's own requests, most recently changed first (My Requests, notification bell).
bloodRequestSchema.index({ userEmail: 1, updatedAt: -1 });
// Admin activity feed: latest cancellations.
bloodRequestSchema.index({ status: 1, cancelledAt: -1 });
// Hospital staff list their own hospital's requests, newest first.
bloodRequestSchema.index({ hospital: 1, createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
