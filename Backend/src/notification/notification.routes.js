const express = require('express');
const router = express.Router();
const Message = require('./message.model');
const Appointment = require('../appointments/appointment.model');
const BloodRequest = require('../requests/blood-request.model');
const User = require('../users/user.model');
const StaffUser = require('../staff/staff.model');
const Donor = require('../donor/donor.model');
const Inventory = require('../inventory/inventory.model');
const { requireRole } = require('../common/middleware/require-role');
const { sendError } = require('../common/middleware/error-handler');

const donorAuth = requireRole('donor');
const adminAuth = requireRole('admin');
const LIMIT = 30;
const DAY = 86400000;

// "2026-10-04" -> midnight that day (server local time), or null for a malformed date.
const dayStart = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  const t = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(t.getTime()) ? null : t;
};
const shortDate = (iso) => dayStart(iso)?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) ?? iso;
// Today as "YYYY-MM-DD" (server local time), the format appointment dates are stored in.
const localIsoDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Additive: a message key and raw values, so the website can show the item in the reader's
// language (frontend i18n/messages/feed.js). `title`/`body` stay as before, in English.
const tx = (key, vars = {}) => ({ key, vars });
const clip = (text, n = 110) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);

const APPOINTMENT_STATUS = {
  Confirmed: { tone: 'success', title: 'Appointment confirmed' },
  Cancelled: { tone: 'error', title: 'Appointment cancelled' },
  CheckedIn: { tone: 'success', title: 'Thank you for donating!' },
};
const REQUEST_STATUS = {
  Approved: { tone: 'success', title: 'Blood request approved' },
  Rejected: { tone: 'error', title: 'Blood request not approved' },
  Fulfilled: { tone: 'success', title: 'Blood request fulfilled' },
};

// Builds the donor's feed from records that already exist: replies from the BloodLife team,
// status changes on their appointments and blood requests, and reminders for appointments
// in the next two days. Nothing is stored per notification — only when the feed was last seen.
async function buildFeed(user) {
  const email = user.email.toLowerCase();
  const [replies, appointments, requests] = await Promise.all([
    // Deleted replies are left out entirely — their text must never reach the donor.
    Message.find({ userId: user.id, sender: 'admin', deletedAt: null }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
    Appointment.find({ email }).sort({ updatedAt: -1 }).limit(LIMIT).lean(),
    BloodRequest.find({ userEmail: email, status: { $ne: 'Pending' } }).sort({ updatedAt: -1 }).limit(LIMIT).lean(),
  ]);

  const items = [];
  replies.forEach((m) => items.push({
    id: `message-${m._id}`, type: 'message', tone: 'info',
    title: 'New reply from the BloodLife team', body: clip(m.content),
    i18n: { title: tx('donor.reply') },
    href: '/notification', at: m.createdAt,
  }));

  const now = Date.now();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  appointments.forEach((a) => {
    const where = a.location ? ` at ${a.location}` : '';
    const when = `${shortDate(a.date)}, ${a.time}`;
    const status = APPOINTMENT_STATUS[a.status];
    if (status) {
      // Prefer the moment the status changed; older records only have updatedAt.
      const changedAt = { CheckedIn: a.checkedInAt, Confirmed: a.confirmedAt, Cancelled: a.cancelledAt }[a.status];
      items.push({
        id: `appointment-${a._id}-${a.status}`, type: 'appointment', tone: status.tone, title: status.title,
        body: a.status === 'CheckedIn' ? `Your donation${where} has been recorded.` : `${when}${where}`,
        i18n: {
          title: tx(`donor.appt.${a.status}`),
          body: a.status === 'CheckedIn'
            ? tx(a.location ? 'donor.donationRecordedAt' : 'donor.donationRecorded', { place: a.location })
            : tx(a.location ? 'common.whenAt' : 'common.when', { date: a.date, time: a.time, place: a.location }),
        },
        href: '/my-appointments', at: changedAt || a.updatedAt,
      });
    }
    // Reschedule requests the hospital has answered (direct changes made before confirmation
    // are the donor's own action, so they don't notify).
    (a.rescheduleRequests || []).forEach((r) => {
      if (r.reviewerRole === 'system' || !r.reviewedAt) return;
      const from = `${shortDate(r.fromDate)}, ${r.fromTime}`;
      const to = `${shortDate(r.toDate)}, ${r.toTime}`;
      if (r.status === 'Approved') {
        items.push({
          id: `reschedule-${r._id}-Approved`, type: 'appointment', tone: 'success', title: 'Hospital approved the new date',
          body: `Your appointment${where} has been moved to ${to}.`, href: '/my-appointments', at: r.reviewedAt,
          i18n: { title: tx('donor.rescheduleApproved'), body: tx(a.location ? 'donor.movedAt' : 'donor.moved', { place: a.location, date: r.toDate, time: r.toTime }) },
        });
      } else if (r.status === 'Rejected') {
        items.push({
          id: `reschedule-${r._id}-Rejected`, type: 'appointment', tone: 'error', title: 'Reschedule request declined',
          body: clip(`Your appointment stays on ${from}${where}.${r.decisionNote ? ` ${r.decisionNote}` : ''}`),
          i18n: { title: tx('donor.rescheduleDeclined'), body: tx(a.location ? 'donor.staysAt' : 'donor.stays', { place: a.location, date: r.fromDate, time: r.fromTime, suffix: r.decisionNote ? clip(r.decisionNote, 80) : '' }) },
          href: '/my-appointments', at: r.reviewedAt,
        });
      }
    });
    // Reminder for a still-active appointment today, tomorrow or the day after.
    const day = dayStart(a.date);
    if (day && (a.status === 'Pending' || a.status === 'Confirmed')) {
      const daysAway = Math.round((day - today) / DAY);
      if (daysAway >= 0 && daysAway <= 2) {
        const label = daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `on ${shortDate(a.date)}`;
        items.push({
          id: `reminder-${a._id}`, type: 'reminder', tone: 'warning',
          title: `Your appointment is ${label}`, body: `${a.time}${where}. Remember to bring a photo ID.`,
          i18n: {
            title: tx(daysAway === 0 ? 'donor.reminderToday' : daysAway === 1 ? 'donor.reminderTomorrow' : 'donor.reminderOn', { date: a.date }),
            body: tx(a.location ? 'donor.bringIdAt' : 'donor.bringId', { time: a.time, place: a.location }),
          },
          href: '/my-appointments', at: new Date(Math.min(now, Math.max(new Date(a.createdAt).getTime(), day.getTime() - 2 * DAY))),
        });
      }
    }
  });

  requests.forEach((r) => {
    const status = REQUEST_STATUS[r.status];
    if (!status) return;
    items.push({
      id: `request-${r._id}-${r.status}`, type: 'request', tone: status.tone, title: status.title,
      body: `${r.bloodType} for ${r.patientName} at ${r.hospitalName}`,
      i18n: { title: tx(`donor.request.${r.status}`), body: tx('common.requestForAt', { type: r.bloodType, patient: r.patientName, hospital: r.hospitalName }) },
      href: '/my-requests', at: r.status === 'Fulfilled' && r.fulfilledAt ? r.fulfilledAt : r.updatedAt,
    });
  });

  items.sort((x, y) => new Date(y.at) - new Date(x.at));
  return items.slice(0, LIMIT);
}

router.get('/', donorAuth, async (req, res) => {
  try {
    const account = await User.findById(req.user.id).select('notificationsSeenAt').lean();
    const seenAt = account?.notificationsSeenAt || null;
    const items = (await buildFeed(req.user)).map((item) => ({
      ...item, unread: !seenAt || new Date(item.at) > new Date(seenAt),
    }));
    res.json({ items, unread: items.filter((i) => i.unread).length, seenAt });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Marks everything up to now as seen.
router.post('/seen', donorAuth, async (req, res) => {
  try {
    const seenAt = new Date();
    await User.updateOne({ _id: req.user.id }, { $set: { notificationsSeenAt: seenAt } });
    res.json({ seenAt });
  } catch (err) {
    sendError(res, err, req);
  }
});

// ── Admin feed ──────────────────────────────────────────────────────────────────
// Same idea as the donor feed: events that already exist as records, newest first, with an
// unread marker against when this admin last opened the list. Nothing is stored per item.
const URGENCY_TONE = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'info' };
const units = (n) => `${n || 1} unit${(n || 1) === 1 ? '' : 's'}`;

async function buildAdminFeed() {
  const [requests, cancelled, appointments, messages, donors, stock, rescheduling] = await Promise.all([
    BloodRequest.find().sort({ createdAt: -1 }).limit(LIMIT).lean(),
    BloodRequest.find({ status: 'Cancelled', cancelledAt: { $ne: null } }).sort({ cancelledAt: -1 }).limit(LIMIT).lean(),
    Appointment.find().sort({ createdAt: -1 }).limit(LIMIT).lean(),
    Message.find({ sender: 'user', deletedAt: null }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
    Donor.find().select('fullName bloodType location createdAt').sort({ createdAt: -1 }).limit(LIMIT).lean(),
    Inventory.find({ hospital: null }).lean(), // the central pool the admin manages
    Appointment.find({ 'rescheduleRequests.status': 'Pending' }).sort({ updatedAt: -1 }).limit(LIMIT).lean(),
  ]);

  const items = [];
  requests.forEach((r) => items.push({
    id: `request-new-${r._id}`, type: 'request', tone: URGENCY_TONE[r.urgency] || 'info',
    title: r.urgency === 'Critical' ? 'Critical blood request' : 'New blood request',
    body: `${r.bloodType} · ${units(r.unitsNeeded)} for ${r.patientName} at ${r.hospitalName}${r.urgency ? ` · ${r.urgency} urgency` : ''}`,
    i18n: {
      title: tx(r.urgency === 'Critical' ? 'staff.criticalRequest' : 'staff.newRequest'),
      body: tx(r.urgency ? 'staff.requestUrgencyAt' : 'staff.requestAt', { type: r.bloodType, units: r.unitsNeeded || 1, patient: r.patientName, hospital: r.hospitalName, urgency: r.urgency }),
    },
    href: '/dashboard/admin/requests', at: r.createdAt,
  }));
  cancelled.forEach((r) => items.push({
    id: `request-cancelled-${r._id}`, type: 'cancelled', tone: 'neutral',
    title: 'Blood request cancelled by the requester',
    body: `${r.bloodType} for ${r.patientName} at ${r.hospitalName}${r.cancellationReason ? ` — “${clip(r.cancellationReason, 80)}”` : ''}`,
    i18n: { title: tx('staff.requestCancelled'), body: tx('common.requestForAt', { type: r.bloodType, patient: r.patientName, hospital: r.hospitalName, quote: r.cancellationReason ? clip(r.cancellationReason, 80) : '' }) },
    href: '/dashboard/admin/requests', at: r.cancelledAt,
  }));
  appointments.forEach((a) => items.push({
    id: `appointment-new-${a._id}`, type: 'appointment', tone: 'info',
    title: 'New appointment booked',
    body: `${a.fullName} · ${shortDate(a.date)}, ${a.time}${a.location ? ` at ${a.location}` : ''}`,
    i18n: { title: tx('staff.newAppointment'), body: tx(a.location ? 'staff.bookedAt' : 'staff.booked', { name: a.fullName, date: a.date, time: a.time, place: a.location }) },
    href: '/dashboard/admin/appointments', at: a.createdAt,
  }));
  rescheduling.forEach((a) => (a.rescheduleRequests || []).forEach((r) => {
    if (r.status !== 'Pending') return;
    items.push({
      id: `reschedule-${r._id}`, type: 'appointment', tone: 'warning',
      title: 'Reschedule requested',
      body: `${a.fullName} · ${shortDate(r.fromDate)}, ${r.fromTime} → ${shortDate(r.toDate)}, ${r.toTime}${a.location ? ` at ${a.location}` : ''}`,
      i18n: { title: tx('staff.rescheduleRequested'), body: tx(a.location ? 'staff.moveAt' : 'staff.move', { name: a.fullName, fromDate: r.fromDate, fromTime: r.fromTime, toDate: r.toDate, toTime: r.toTime, place: a.location }) },
      href: '/dashboard/admin/appointments', at: r.requestedAt,
    });
  }));
  messages.forEach((m) => items.push({
    id: `message-${m._id}`, type: 'message', tone: 'primary',
    title: `New message from ${m.userName}`, body: clip(m.content),
    i18n: { title: tx('staff.messageFrom', { name: m.userName }) },
    href: '/dashboard/admin/contacts', at: m.createdAt,
  }));
  donors.forEach((d) => items.push({
    id: `donor-${d._id}`, type: 'donor', tone: 'success',
    title: 'New donor registered',
    i18n: { title: tx('staff.newDonor') },
    body: [d.fullName, d.bloodType, d.location].filter(Boolean).join(' · '),
    href: '/dashboard/admin/donors', at: d.createdAt,
  }));
  // Stock alerts are a state, not an event: one item per blood type that is below its minimum
  // right now, dated by the last stock change. The id includes the level, so a further drop
  // shows up as new.
  stock.filter((i) => i.units < i.minUnits).forEach((i) => items.push({
    id: `stock-${i._id}-${i.units}`, type: 'stock', tone: 'error',
    title: i.units === 0 ? `${i.bloodType} is out of stock` : `${i.bloodType} stock is critically low`,
    body: `${i.units} of minimum ${i.minUnits} units left in the central inventory`,
    i18n: { title: tx(i.units === 0 ? 'staff.outOfStock' : 'staff.lowStock', { type: i.bloodType }), body: tx('staff.stockLeftCentral', { count: i.units, min: i.minUnits }) },
    href: '/dashboard/admin/inventory', at: i.lastUpdated || i.updatedAt || new Date(0),
  }));

  items.sort((x, y) => new Date(y.at) - new Date(x.at));
  return items.slice(0, LIMIT);
}

router.get('/admin', adminAuth, async (req, res) => {
  try {
    const account = await StaffUser.findById(req.admin.id).select('notificationsSeenAt').lean();
    const seenAt = account?.notificationsSeenAt || null;
    const items = (await buildAdminFeed()).map((item) => ({
      ...item, unread: !seenAt || new Date(item.at) > new Date(seenAt),
    }));
    res.json({ items, unread: items.filter((i) => i.unread).length, seenAt });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Marks this admin's feed as seen up to now (per admin account, so each admin has their own badge).
router.post('/admin/seen', adminAuth, async (req, res) => {
  try {
    const seenAt = new Date();
    await StaffUser.updateOne({ _id: req.admin.id }, { $set: { notificationsSeenAt: seenAt } });
    res.json({ seenAt });
  } catch (err) {
    sendError(res, err, req);
  }
});

// ── Hospital staff feed ─────────────────────────────────────────────────────────
// Real events for the staff member's own hospital (the same scope as their requests and
// appointments lists), newest first, with "unread" measured per staff account.
const staffAuth = requireRole('hospital_staff');
const HOSPITAL = '/dashboard/hospital';

async function buildHospitalFeed(hospitalId) {
  const scope = { hospital: hospitalId };
  const [requests, cancelledRequests, booked, cancelledAppts, rescheduling, todays, stock] = await Promise.all([
    BloodRequest.find(scope).sort({ createdAt: -1 }).limit(LIMIT).lean(),
    BloodRequest.find({ ...scope, status: 'Cancelled', cancelledAt: { $ne: null } }).sort({ cancelledAt: -1 }).limit(LIMIT).lean(),
    Appointment.find(scope).sort({ createdAt: -1 }).limit(LIMIT).lean(),
    Appointment.find({ ...scope, status: 'Cancelled', cancelledBy: 'donor', cancelledAt: { $ne: null } }).sort({ cancelledAt: -1 }).limit(LIMIT).lean(),
    Appointment.find({ ...scope, 'rescheduleRequests.status': 'Pending' }).sort({ updatedAt: -1 }).limit(LIMIT).lean(),
    Appointment.find({ ...scope, date: localIsoDay(), status: { $in: ['Pending', 'Confirmed'] } }).select('status').lean(),
    Inventory.find(scope).lean(),
  ]);

  const items = [];
  requests.forEach((r) => items.push({
    id: `request-new-${r._id}`, type: 'request', tone: URGENCY_TONE[r.urgency] || 'info',
    title: r.urgency === 'Critical' ? 'Critical blood request' : 'New blood request',
    body: `${r.bloodType} · ${units(r.unitsNeeded)} for ${r.patientName}${r.urgency ? ` · ${r.urgency} urgency` : ''}`,
    i18n: {
      title: tx(r.urgency === 'Critical' ? 'staff.criticalRequest' : 'staff.newRequest'),
      body: tx(r.urgency ? 'staff.requestUrgency' : 'staff.request', { type: r.bloodType, units: r.unitsNeeded || 1, patient: r.patientName, urgency: r.urgency }),
    },
    href: `${HOSPITAL}/requests`, at: r.createdAt,
  }));
  cancelledRequests.forEach((r) => items.push({
    id: `request-cancelled-${r._id}`, type: 'cancelled', tone: 'neutral',
    title: 'Blood request cancelled by the requester',
    body: `${r.bloodType} for ${r.patientName}${r.cancellationReason ? ` — “${clip(r.cancellationReason, 80)}”` : ''}`,
    i18n: { title: tx('staff.requestCancelled'), body: tx('common.requestFor', { type: r.bloodType, patient: r.patientName, quote: r.cancellationReason ? clip(r.cancellationReason, 80) : '' }) },
    href: `${HOSPITAL}/requests`, at: r.cancelledAt,
  }));
  booked.forEach((a) => items.push({
    id: `appointment-new-${a._id}`, type: 'appointment', tone: 'info',
    title: 'New appointment booked',
    body: `${a.fullName} (${a.bloodType}) · ${shortDate(a.date)}, ${a.time}`,
    i18n: { title: tx('staff.newAppointment'), body: tx('staff.bookedType', { name: a.fullName, type: a.bloodType, date: a.date, time: a.time }) },
    href: `${HOSPITAL}/appointments`, at: a.createdAt,
  }));
  cancelledAppts.forEach((a) => items.push({
    id: `appointment-cancelled-${a._id}`, type: 'cancelled', tone: 'neutral',
    title: 'Donor cancelled an appointment',
    body: `${a.fullName} · ${shortDate(a.date)}, ${a.time}${a.cancellationReason ? ` — “${clip(a.cancellationReason, 80)}”` : ''}`,
    i18n: { title: tx('staff.donorCancelled'), body: tx('staff.booked', { name: a.fullName, date: a.date, time: a.time, quote: a.cancellationReason ? clip(a.cancellationReason, 80) : '' }) },
    href: `${HOSPITAL}/appointments`, at: a.cancelledAt,
  }));
  rescheduling.forEach((a) => (a.rescheduleRequests || []).forEach((r) => {
    if (r.status !== 'Pending') return;
    items.push({
      id: `reschedule-${r._id}`, type: 'appointment', tone: 'warning',
      title: 'Donor asked to reschedule',
      body: `${a.fullName} · ${shortDate(r.fromDate)}, ${r.fromTime} → ${shortDate(r.toDate)}, ${r.toTime}`,
      i18n: { title: tx('staff.donorReschedule'), body: tx('staff.move', { name: a.fullName, fromDate: r.fromDate, fromTime: r.fromTime, toDate: r.toDate, toTime: r.toTime }) },
      href: `${HOSPITAL}/appointments`, at: r.requestedAt,
    });
  }));
  // Today's workload, as one morning summary (a state, dated at the start of the day; the id
  // includes the count so a booking added later in the day shows up as new).
  if (todays.length) {
    const toConfirm = todays.filter((a) => a.status === 'Pending').length;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    items.push({
      id: `today-${localIsoDay()}-${todays.length}-${toConfirm}`, type: 'reminder', tone: 'warning',
      title: `${todays.length} donor${todays.length === 1 ? '' : 's'} booked for today`,
      body: toConfirm ? `${toConfirm} still to confirm — check donors in as they arrive.` : 'All confirmed — check donors in as they arrive.',
      i18n: { title: tx('staff.todayBooked', { count: todays.length }), body: toConfirm ? tx('staff.todayToConfirm', { count: toConfirm }) : tx('staff.todayAllConfirmed') },
      href: `${HOSPITAL}/appointments`, at: start,
    });
  }
  // This hospital's stock below its minimum right now (the id carries the level, so a further drop is new).
  stock.filter((i) => i.units < i.minUnits).forEach((i) => items.push({
    id: `stock-${i._id}-${i.units}`, type: 'stock', tone: 'error',
    title: i.units === 0 ? `${i.bloodType} is out of stock` : `${i.bloodType} stock is critically low`,
    body: `${i.units} of minimum ${i.minUnits} units left`,
    i18n: { title: tx(i.units === 0 ? 'staff.outOfStock' : 'staff.lowStock', { type: i.bloodType }), body: tx('staff.stockLeft', { count: i.units, min: i.minUnits }) },
    href: `${HOSPITAL}/inventory`, at: i.lastUpdated || i.updatedAt || new Date(0),
  }));

  items.sort((x, y) => new Date(y.at) - new Date(x.at));
  return items.slice(0, LIMIT);
}

router.get('/hospital', staffAuth, async (req, res) => {
  try {
    if (!req.staff.hospitalId) return res.status(403).json({ message: 'Your account is not linked to a hospital' });
    const account = await StaffUser.findById(req.staff.id).select('notificationsSeenAt').lean();
    const seenAt = account?.notificationsSeenAt || null;
    const items = (await buildHospitalFeed(req.staff.hospitalId)).map((item) => ({
      ...item, unread: !seenAt || new Date(item.at) > new Date(seenAt),
    }));
    res.json({ items, unread: items.filter((i) => i.unread).length, seenAt });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Per staff account, so each person at the hospital has their own badge.
router.post('/hospital/seen', staffAuth, async (req, res) => {
  try {
    const seenAt = new Date();
    await StaffUser.updateOne({ _id: req.staff.id }, { $set: { notificationsSeenAt: seenAt } });
    res.json({ seenAt });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
