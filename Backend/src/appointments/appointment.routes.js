const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Appointment = require('./appointment.model');
const Donor = require('../donor/donor.model');
const Hospital = require('../hospital/hospital.model');
const User = require('../users/user.model');
const { requireRole } = require('../common/middleware/require-role');
const { assertHospitalScope } = require('../common/middleware/assert-hospital-scope');
const { sendError } = require('../common/middleware/error-handler');

const {
  TIME_SLOTS, SLOT_CAPACITY, ACTIVE_STATUSES, validateAppointmentDay, slotLoad, checkSlot,
} = require('./availability');

const SLOT_FORMAT = /^\d{2}:\d{2} (AM|PM)$/;
const REASON_MIN = 5;
const REASON_MAX = 500;

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

    // Server-side availability: the slot must have room and the donor can't double-book a day.
    const clash = await checkSlot({ hospital: hospitalDoc?._id, email, date, time });
    if (clash) return res.status(409).json({ error: clash });

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

// Appointments only store the donor's email, so look up a photo for each one: the donor
// record's photo first, then the donor's own account photo. One query per collection.
const withDonorPhotos = async (appts) => {
  const emails = [...new Set(appts.map((a) => a.email).filter(Boolean))];
  if (!emails.length) return appts;
  const [donors, users] = await Promise.all([
    Donor.find({ email: { $in: emails }, photo: { $ne: null } }).select('email photo').lean(),
    User.find({ email: { $in: emails }, photo: { $ne: null } }).select('email photo').lean(),
  ]);
  const photos = new Map();
  for (const u of users) photos.set(u.email.toLowerCase(), u.photo);
  for (const d of donors) photos.set(d.email.toLowerCase(), d.photo);
  return appts.map((a) => ({ ...a, donorPhoto: photos.get(a.email) || null }));
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
    res.json(await withDonorPhotos(await Appointment.find(filter).sort({ createdAt: -1 }).lean()));
  } catch (err) {
    sendError(res, err, req);
  }
});

// Free places per slot for one hospital and day, so the booking and reschedule pickers can
// grey out full slots. Counts only — no donor details — so it is public like booking itself.
router.get('/availability', async (req, res) => {
  try {
    const { hospital, date, exclude } = req.query;
    if (!mongoose.isValidObjectId(hospital)) return res.status(400).json({ error: 'A valid hospital is required.' });
    const dateError = validateAppointmentDay(date);
    if (dateError) return res.status(400).json({ error: dateError });
    const load = await slotLoad(hospital, date, mongoose.isValidObjectId(exclude) ? exclude : null);
    res.json({
      hospital, date, capacity: SLOT_CAPACITY,
      slots: TIME_SLOTS.map((time) => {
        const booked = load[time] || 0;
        return { time, booked, remaining: Math.max(0, SLOT_CAPACITY - booked), available: booked < SLOT_CAPACITY };
      }),
    });
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
    const [withPhoto] = await withDonorPhotos([appt]);
    res.json(withPhoto);
  } catch (err) {
    sendError(res, err, req);
  }
});

// A pending reschedule request can't outlive its appointment: cancelling or checking in closes it.
function closePendingRequests(appt, note, at) {
  for (const r of appt.rescheduleRequests || []) {
    if (r.status !== 'Pending') continue;
    r.status = 'Withdrawn';
    r.reviewedAt = at;
    r.decisionNote = note;
  }
}

// Only the status can be changed here, and only between the states that carry no side effects.
// Checking in goes through PATCH /:id/check-in, which also records the donation on the donor,
// and a checked-in appointment is final so that donation record can't drift out of sync.
// Everything else in the body (hospital, checkedInAt, contact details …) is ignored.
const EDITABLE_STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

router.put('/:id', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!EDITABLE_STATUSES.includes(status))
      return res.status(400).json({ error: `Status must be one of: ${EDITABLE_STATUSES.join(', ')}` });
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (!assertHospitalScope(req, appt))
      return res.status(403).json({ error: "Not your hospital's appointment" });
    if (appt.status === 'CheckedIn')
      return res.status(409).json({ error: 'This donor has already checked in; the appointment can no longer be changed.' });
    const now = new Date();
    if (status === 'Confirmed' && appt.status !== 'Confirmed') appt.confirmedAt = now;
    if (status === 'Cancelled' && appt.status !== 'Cancelled') {
      appt.cancelledAt = now;
      appt.cancelledBy = 'staff';
      closePendingRequests(appt, 'Closed because the hospital cancelled the appointment.', now);
    }
    appt.status = status;
    const updated = await appt.save();
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
    closePendingRequests(appt, 'Closed because the donor checked in.', appt.checkedInAt);
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

// ── Donor: cancel and reschedule their own appointment ─────────────────────────────────────
//
// Rules:
//   Pending (not yet confirmed)  - the donor may move it directly or cancel it.
//   Confirmed                    - the donor may cancel, but moving it needs a reschedule request
//                                  that the hospital approves; the appointment stays as it is
//                                  until then. One open request per appointment.
//   CheckedIn / Cancelled        - final; nothing can change.
// Every write below is a conditional update on the status it was checked against, so two
// requests racing each other (or a staff action in between) can't both succeed.

const donorAuth = requireRole('donor');
// Oldest day still counted as "today or later": one day of slack, as in validateAppointmentDay.
const earliestDay = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const isPast = (appt) => appt.date < earliestDay();

// The caller's own appointment, or null after sending a 404 (never reveal someone else's).
async function loadOwn(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).json({ error: 'Appointment not found' }); return null; }
  const appt = await Appointment.findById(req.params.id);
  if (!appt || appt.email !== String(req.user.email || '').toLowerCase()) {
    res.status(404).json({ error: 'Appointment not found' });
    return null;
  }
  return appt;
}

// Shared checks for a proposed new date and time. Returns an error message or null.
function validateNewSlot(appt, date, time) {
  const dateError = validateAppointmentDay(date);
  if (dateError) return dateError;
  if (date < earliestDay()) return 'Appointment dates cannot be in the past.';
  if (!TIME_SLOTS.includes(time)) return 'Please choose one of the available time slots.';
  if (date === appt.date && time === appt.time) return 'Choose a date or time different from your current appointment.';
  return null;
}

const lockedError = (appt) => {
  if (appt.status === 'CheckedIn') return 'You have already checked in for this appointment, so it can no longer be changed.';
  if (appt.status === 'Cancelled') return 'This appointment has been cancelled.';
  if (isPast(appt)) return 'This appointment date has already passed.';
  return null;
};

// Pending appointment: move it straight away (the hospital hasn't committed to the slot yet).
// The change is still recorded in the request history, marked as applied without review.
router.patch('/:id/schedule', donorAuth, async (req, res) => {
  try {
    const appt = await loadOwn(req, res);
    if (!appt) return;
    const locked = lockedError(appt);
    if (locked) return res.status(409).json({ error: locked });
    if (appt.status !== 'Pending')
      return res.status(409).json({ error: 'The hospital has confirmed this appointment. Send a reschedule request instead.', code: 'NEEDS_REQUEST' });

    const { date, time } = req.body || {};
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, REASON_MAX) : '';
    const invalid = validateNewSlot(appt, date, time);
    if (invalid) return res.status(400).json({ error: invalid });
    const clash = await checkSlot({ hospital: appt.hospital, email: appt.email, date, time, excludeId: appt._id });
    if (clash) return res.status(409).json({ error: clash });

    const now = new Date();
    const updated = await Appointment.findOneAndUpdate(
      { _id: appt._id, status: 'Pending', date: appt.date, time: appt.time },
      {
        $set: { date, time, rescheduledAt: now },
        $push: { rescheduleRequests: {
          fromDate: appt.date, fromTime: appt.time, toDate: date, toTime: time,
          reason: reason || 'Changed before the hospital confirmed the appointment.',
          status: 'Approved', requestedAt: now, reviewedAt: now, reviewerRole: 'system',
          decisionNote: 'Applied immediately because the hospital had not confirmed the appointment yet.',
        } },
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(409).json({ error: 'This appointment changed while you were editing it. Please reload and try again.' });
    res.json(updated);
  } catch (err) {
    sendError(res, err, req);
  }
});

// Confirmed appointment: ask the hospital to move it. Nothing about the appointment changes yet.
router.post('/:id/reschedule-requests', donorAuth, async (req, res) => {
  try {
    const appt = await loadOwn(req, res);
    if (!appt) return;
    const locked = lockedError(appt);
    if (locked) return res.status(409).json({ error: locked });
    if (appt.status === 'Pending')
      return res.status(409).json({ error: 'This appointment is not confirmed yet, so you can change the date directly.', code: 'USE_DIRECT_CHANGE' });
    if (!appt.hospital)
      return res.status(409).json({ error: 'This booking is not linked to a registered hospital. Please contact the donation center to change it.' });

    const { date, time } = req.body || {};
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    const invalid = validateNewSlot(appt, date, time);
    if (invalid) return res.status(400).json({ error: invalid });
    if (reason.length < REASON_MIN) return res.status(400).json({ error: 'Please tell the hospital briefly why you need to change the date.' });
    if (reason.length > REASON_MAX) return res.status(400).json({ error: `The reason can be at most ${REASON_MAX} characters.` });
    // Checked now so the donor hears about a full slot straight away; checked again at approval.
    const clash = await checkSlot({ hospital: appt.hospital, email: appt.email, date, time, excludeId: appt._id });
    if (clash) return res.status(409).json({ error: clash });

    const updated = await Appointment.findOneAndUpdate(
      { _id: appt._id, status: 'Confirmed', rescheduleRequests: { $not: { $elemMatch: { status: 'Pending' } } } },
      { $push: { rescheduleRequests: {
        fromDate: appt.date, fromTime: appt.time, toDate: date, toTime: time, reason, status: 'Pending', requestedAt: new Date(),
      } } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      const fresh = await Appointment.findById(appt._id).lean();
      const open = fresh?.rescheduleRequests?.some((r) => r.status === 'Pending');
      return res.status(409).json({
        error: open ? 'You already have a reschedule request waiting for the hospital.' : 'This appointment changed while you were editing it. Please reload and try again.',
      });
    }
    res.status(201).json(updated);
  } catch (err) {
    sendError(res, err, req);
  }
});

// Donor takes back a request the hospital hasn't decided yet.
router.delete('/:id/reschedule-requests/:requestId', donorAuth, async (req, res) => {
  try {
    const appt = await loadOwn(req, res);
    if (!appt) return;
    if (!mongoose.isValidObjectId(req.params.requestId)) return res.status(404).json({ error: 'Request not found' });
    const updated = await Appointment.findOneAndUpdate(
      { _id: appt._id, rescheduleRequests: { $elemMatch: { _id: req.params.requestId, status: 'Pending' } } },
      { $set: {
        'rescheduleRequests.$.status': 'Withdrawn',
        'rescheduleRequests.$.reviewedAt': new Date(),
        'rescheduleRequests.$.decisionNote': 'Withdrawn by the donor.',
      } },
      { new: true }
    );
    if (!updated) return res.status(409).json({ error: 'This request has already been answered or withdrawn.' });
    res.json(updated);
  } catch (err) {
    sendError(res, err, req);
  }
});

router.post('/:id/cancel', donorAuth, async (req, res) => {
  try {
    const appt = await loadOwn(req, res);
    if (!appt) return;
    if (appt.status === 'CheckedIn') return res.status(409).json({ error: 'You have already checked in for this appointment.' });
    if (appt.status === 'Cancelled') return res.status(409).json({ error: 'This appointment is already cancelled.' });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length > REASON_MAX) return res.status(400).json({ error: `The reason can be at most ${REASON_MAX} characters.` });

    const now = new Date();
    const updated = await Appointment.findOneAndUpdate(
      { _id: appt._id, status: { $in: ACTIVE_STATUSES } },
      { $set: {
        status: 'Cancelled', cancelledAt: now, cancelledBy: 'donor', cancellationReason: reason,
        'rescheduleRequests.$[open].status': 'Withdrawn',
        'rescheduleRequests.$[open].reviewedAt': now,
        'rescheduleRequests.$[open].decisionNote': 'Closed because the donor cancelled the appointment.',
      } },
      { new: true, arrayFilters: [{ 'open.status': 'Pending' }] }
    );
    if (!updated) return res.status(409).json({ error: 'This appointment can no longer be cancelled. Please reload.' });
    res.json(updated);
  } catch (err) {
    sendError(res, err, req);
  }
});

// ── Hospital / admin: decide a reschedule request ─────────────────────────────────────────
// Approval re-checks the slot (it may have filled up since the donor asked) and only then moves
// the appointment, in one conditional update. Rejection leaves the appointment untouched.
router.patch('/:id/reschedule-requests/:requestId', requireRole('admin', 'hospital_staff'), async (req, res) => {
  try {
    const { id, requestId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(requestId))
      return res.status(404).json({ error: 'Request not found' });
    const decision = req.body?.decision;
    if (!['approve', 'reject'].includes(decision))
      return res.status(400).json({ error: 'Decision must be "approve" or "reject".' });
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    if (note.length > REASON_MAX) return res.status(400).json({ error: `The note can be at most ${REASON_MAX} characters.` });

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (!assertHospitalScope(req, appt)) return res.status(403).json({ error: "Not your hospital's appointment" });
    const request = appt.rescheduleRequests.id(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'Pending') return res.status(409).json({ error: `This request has already been ${request.status.toLowerCase()}.` });
    if (appt.status !== 'Confirmed')
      return res.status(409).json({ error: 'Only a confirmed appointment can be rescheduled.' });

    const now = new Date();
    const reviewer = {
      'rescheduleRequests.$.reviewedAt': now,
      'rescheduleRequests.$.reviewedBy': req.auth.id,
      'rescheduleRequests.$.reviewerName': req.auth.fullName || '',
      'rescheduleRequests.$.reviewerRole': req.auth.role,
      'rescheduleRequests.$.decisionNote': note,
    };
    const stillOpen = { _id: appt._id, status: 'Confirmed', rescheduleRequests: { $elemMatch: { _id: request._id, status: 'Pending' } } };

    let update;
    if (decision === 'approve') {
      if (request.toDate < earliestDay())
        return res.status(409).json({ error: 'The requested date has already passed. Please reject the request instead.' });
      const clash = await checkSlot({
        hospital: appt.hospital, email: appt.email, date: request.toDate, time: request.toTime, excludeId: appt._id,
      });
      if (clash) return res.status(409).json({ error: `Cannot approve: ${clash.charAt(0).toLowerCase()}${clash.slice(1)}`, code: 'SLOT_UNAVAILABLE' });
      update = { $set: {
        date: request.toDate, time: request.toTime, rescheduledAt: now,
        'rescheduleRequests.$.status': 'Approved', ...reviewer,
      } };
    } else {
      update = { $set: { 'rescheduleRequests.$.status': 'Rejected', ...reviewer } };
    }

    const updated = await Appointment.findOneAndUpdate(stillOpen, update, { new: true, runValidators: true });
    if (!updated) return res.status(409).json({ error: 'This appointment changed in the meantime. Please reload and try again.' });
    res.json(updated);
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
