const express = require('express');
const router = express.Router();
const Message = require('./message.model');
const Appointment = require('../appointments/appointment.model');
const BloodRequest = require('../requests/blood-request.model');
const User = require('../users/user.model');
const { requireRole } = require('../common/middleware/require-role');
const { sendError } = require('../common/middleware/error-handler');

const donorAuth = requireRole('donor');
const LIMIT = 30;
const DAY = 86400000;

// "2026-10-04" -> midnight that day (server local time), or null for a malformed date.
const dayStart = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  const t = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(t.getTime()) ? null : t;
};
const shortDate = (iso) => dayStart(iso)?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) ?? iso;
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
    Message.find({ userId: user.id, sender: 'admin' }).sort({ createdAt: -1 }).limit(LIMIT).lean(),
    Appointment.find({ email }).sort({ updatedAt: -1 }).limit(LIMIT).lean(),
    BloodRequest.find({ userEmail: email, status: { $ne: 'Pending' } }).sort({ updatedAt: -1 }).limit(LIMIT).lean(),
  ]);

  const items = [];
  replies.forEach((m) => items.push({
    id: `message-${m._id}`, type: 'message', tone: 'info',
    title: 'New reply from the BloodLife team', body: clip(m.content),
    href: '/notification', at: m.createdAt,
  }));

  const now = Date.now();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  appointments.forEach((a) => {
    const where = a.location ? ` at ${a.location}` : '';
    const when = `${shortDate(a.date)}, ${a.time}`;
    const status = APPOINTMENT_STATUS[a.status];
    if (status) {
      items.push({
        id: `appointment-${a._id}-${a.status}`, type: 'appointment', tone: status.tone, title: status.title,
        body: a.status === 'CheckedIn' ? `Your donation${where} has been recorded.` : `${when}${where}`,
        href: '/profile', at: a.status === 'CheckedIn' && a.checkedInAt ? a.checkedInAt : a.updatedAt,
      });
    }
    // Reminder for a still-active appointment today, tomorrow or the day after.
    const day = dayStart(a.date);
    if (day && (a.status === 'Pending' || a.status === 'Confirmed')) {
      const daysAway = Math.round((day - today) / DAY);
      if (daysAway >= 0 && daysAway <= 2) {
        const label = daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `on ${shortDate(a.date)}`;
        items.push({
          id: `reminder-${a._id}`, type: 'reminder', tone: 'warning',
          title: `Your appointment is ${label}`, body: `${a.time}${where}. Remember to bring a photo ID.`,
          href: '/profile', at: new Date(Math.min(now, Math.max(new Date(a.createdAt).getTime(), day.getTime() - 2 * DAY))),
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
      href: '/profile', at: r.status === 'Fulfilled' && r.fulfilledAt ? r.fulfilledAt : r.updatedAt,
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

module.exports = router;
