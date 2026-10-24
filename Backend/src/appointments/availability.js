const mongoose = require('mongoose');
const Appointment = require('./appointment.model');

// Bookable slots. Same "08:00 AM" strings the booking page offers and every dashboard shows
// (frontend: app/(public)/appointments/_components/booking.js — keep the two lists in sync).
const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
];

// How many donors one hospital can take in the same half-hour slot.
const SLOT_CAPACITY = Math.max(1, Number(process.env.APPOINTMENT_SLOT_CAPACITY) || 5);

// Appointments that still hold their slot.
const ACTIVE_STATUSES = ['Pending', 'Confirmed'];

// YYYY-MM-DD for a real calendar day that is not in the past. One day of slack because the
// browser's local date can be ahead of this server's (e.g. Cambodia is UTC+7).
function validateAppointmentDay(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Please choose a valid date.';
  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date) return 'Please choose a valid date.';
  if (day.getTime() < Date.now() - 2 * 86400000) return 'Appointment dates cannot be in the past.';
  return null;
}

const excluding = (id) => (id ? { _id: { $ne: new mongoose.Types.ObjectId(String(id)) } } : {});

/** Booked count per slot for one hospital and day. */
async function slotLoad(hospitalId, date, excludeId) {
  const rows = await Appointment.aggregate([
    { $match: { hospital: new mongoose.Types.ObjectId(String(hospitalId)), date, status: { $in: ACTIVE_STATUSES }, ...excluding(excludeId) } },
    { $group: { _id: '$time', count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

/**
 * Can `email` take `time` on `date` at `hospital`? Returns null when it can, or an error message.
 * `excludeId` leaves out the appointment being moved, so it doesn't block itself.
 *   - the slot must not be full at that hospital
 *   - the donor must not already hold another active appointment that day (one donation a day)
 */
async function checkSlot({ hospital, email, date, time, excludeId }) {
  if (hospital) {
    const taken = await Appointment.countDocuments({
      hospital, date, time, status: { $in: ACTIVE_STATUSES }, ...excluding(excludeId),
    });
    if (taken >= SLOT_CAPACITY) return 'That time slot is fully booked. Please choose another time.';
  }
  if (email) {
    const clash = await Appointment.exists({
      email: String(email).toLowerCase(), date, status: { $in: ACTIVE_STATUSES }, ...excluding(excludeId),
    });
    if (clash) return 'You already have another appointment on that day.';
  }
  return null;
}

module.exports = { TIME_SLOTS, SLOT_CAPACITY, ACTIVE_STATUSES, validateAppointmentDay, slotLoad, checkSlot };
