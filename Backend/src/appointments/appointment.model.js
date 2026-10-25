const mongoose = require('mongoose');
const { BLOOD_TYPES } = require('../common/blood-types');

// One donor request to move a confirmed appointment. Requests are never deleted, so the
// appointment keeps a full history: what it was, what was asked, why, who decided and when.
const rescheduleRequestSchema = new mongoose.Schema(
  {
    fromDate: { type: String, required: true },
    fromTime: { type: String, required: true },
    toDate: { type: String, required: true },
    toTime: { type: String, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Withdrawn'], default: 'Pending' },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', default: null },
    reviewerName: { type: String, default: '' },
    reviewerRole: { type: String, default: '' },
    decisionNote: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: true }
);

const appointmentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    bloodType: { type: String, enum: BLOOD_TYPES, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'Confirmed', 'CheckedIn', 'Cancelled'], default: 'Pending' },
    checkedInAt: { type: Date, default: null },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', default: null },
    donationType: { type: String, enum: ['Whole Blood', 'Platelets', 'Plasma'], default: 'Whole Blood' },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ['donor', 'staff', null], default: null },
    cancellationReason: { type: String, trim: true, maxlength: 500, default: '' },
    // Set when an approved reschedule last moved this appointment.
    rescheduledAt: { type: Date, default: null },
    rescheduleRequests: { type: [rescheduleRequestSchema], default: [] },
  },
  { timestamps: true }
);

appointmentSchema.index({ status: 1 });
// A donor's own appointments, most recently changed first (My Appointments, notification bell).
appointmentSchema.index({ email: 1, updatedAt: -1 });
appointmentSchema.index({ createdAt: -1 });
// Hospital staff list their own hospital's appointments, newest first.
appointmentSchema.index({ hospital: 1, createdAt: -1 });
// Slot capacity checks: active appointments at one hospital on one day.
appointmentSchema.index({ hospital: 1, date: 1, time: 1, status: 1 });
// Staff list of reschedule requests waiting for a decision.
appointmentSchema.index({ 'rescheduleRequests.status': 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
