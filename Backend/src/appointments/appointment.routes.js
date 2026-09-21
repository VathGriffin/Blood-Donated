const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Appointment = require('./appointment.model');
const Donor = require('../donor/donor.model');
const Hospital = require('../hospital/hospital.model');
const { requireRole } = require('../common/middleware/require-role');
const { assertHospitalScope } = require('../common/middleware/assert-hospital-scope');
const { sendError } = require('../common/middleware/error-handler');

const SLOT_FORMAT = /^\d{2}:\d{2} (AM|PM)$/;

// YYYY-MM-DD for a real calendar day that is not in the past. One day of slack because the
// browser's local date can be ahead of this server's (e.g. Cambodia is UTC+7).
function validateAppointmentDay(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Please choose a valid date.';
  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date) return 'Please choose a valid date.';
  if (day.getTime() < Date.now() - 2 * 86400000) return 'Appointment dates cannot be in the past.';
  return null;
}

// Public booking endpoint. Only the booking fields are read from the request — anything else
// (status, checkedInAt, checkedInBy …) is ignored, so a visitor can't book themselves in as
// already checked-in. A hospital id must exist, and its name (not client text) becomes the location.
router.post('/', async (req, res) => {
  const { fullName, email, phone, bloodType, date, time, location, hospital, notes } = req.body;
  try {
    const dateError = validateAppointmentDay(date);
    if (dateError) return res.status(400).json({ error: dateError });
    if (typeof time !== 'string' || !SLOT_FORMAT.test(time))
      return res.status(400).json({ error: 'Please choose a valid time slot.' });

    let hospitalDoc = null;
    if (hospital) {
      hospitalDoc = mongoose.isValidObjectId(hospital) ? await Hospital.findById(hospital).select('name').lean() : null;
      if (!hospitalDoc) return res.status(400).json({ error: 'That donation center could not be found.' });
    }

    const appointment = await new Appointment({
      fullName, email, phone, bloodType, date, time, notes,
      hospital: hospitalDoc?._id ?? null,
      location: hospitalDoc?.name ?? location,
    }).save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Appointments hold names, emails and phone numbers, so reading them needs a login and is scoped
// to what that account may see:
//   admin           - everything (optionally filtered with ?hospital= / ?email=)
//   hospital_staff  - their own hospital's appointments only
//   donor           - their own appointments only (matched on their account email)
// A filter that points outside the caller's scope is refused rather than silently ignored.
const readAppointments = requireRole('admin', 'hospital_staff', 'donor');

// Does this caller own / administer the appointment?
const canRead = (req, appt) => {
  if (req.admin) return true;
  if (req.staff) return assertHospitalScope(req, appt);
  return !!req.user?.email && appt.email === req.user.email.toLowerCase();
};

router.get('/', readAppointments, async (req, res) => {
  try {
    const filter = {};
    if (req.staff) {
      if (!req.staff.hospitalId) return res.status(403).json({ error: 'Your account is not linked to a hospital' });
      if (req.query.hospital && String(req.query.hospital) !== String(req.staff.hospitalId))
        return res.status(403).json({ error: "Not your hospital's appointments" });
      filter.hospital = req.staff.hospitalId;
    } else if (req.user) {
      const own = req.user.email.toLowerCase();
      if (req.query.email && String(req.query.email).toLowerCase() !== own)
        return res.status(403).json({ error: 'You can only view your own appointments' });
      if (req.query.hospital) return res.status(403).json({ error: 'Not allowed' });
      filter.email = own;
    } else {
      if (req.query.hospital) filter.hospital = req.query.hospital;
      if (req.query.email) filter.email = String(req.query.email).toLowerCase();
    }
    res.json(await Appointment.find(filter).sort({ createdAt: -1 }).lean());
  } catch (err) {
    sendError(res, err, req);
  }
});

router.get('/:id', readAppointments, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).lean();
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    // 404 (not 403) for someone else's record, so ids can't be probed for existence
    if (!canRead(req, appt)) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    sendError(res, err, req);
  }
});

router.put('/:id', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (!assertHospitalScope(req, appt))
      return res.status(403).json({ error: "Not your hospital's appointment" });
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Checks a donor in for their appointment and reflects the completed donation on
// their Donor record (donationCount, lastDonation, donationHistory) — the natural
// landing point for both manual confirmation and the QR-scan check-in flow.
router.patch('/:id/check-in', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (!assertHospitalScope(req, appt))
      return res.status(403).json({ error: "Not your hospital's appointment" });
    if (appt.status === 'CheckedIn')
      return res.status(400).json({ error: 'Appointment already checked in' });

    appt.status = 'CheckedIn';
    appt.checkedInAt = new Date();
    appt.checkedInBy = req.auth.id;
    await appt.save();

    const donor = await Donor.findOne({ email: appt.email.toLowerCase() });
    if (donor) {
      donor.donationCount = (donor.donationCount || 0) + 1;
      donor.lastDonation = appt.checkedInAt;
      donor.donationHistory.push({
        date: appt.checkedInAt,
        location: appt.location,
        units: 1,
        notes: 'Checked in via appointment',
      });
      await donor.save();
    }

    res.json(appt);
  } catch (err) {
    sendError(res, err, req);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted', id: req.params.id });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
