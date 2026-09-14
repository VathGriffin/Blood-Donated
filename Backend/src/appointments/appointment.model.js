const mongoose = require('mongoose');
const { BLOOD_TYPES } = require('../common/blood-types');

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
  },
  { timestamps: true }
);

appointmentSchema.index({ status: 1 });
appointmentSchema.index({ email: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
