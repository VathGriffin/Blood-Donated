const express = require('express');
const router = express.Router();
const { requireRole } = require('../common/middleware/require-role');
const adminAuth = requireRole('admin');
const Donor = require('../donor/donor.model');
const BloodRequest = require('../requests/blood-request.model');
const Appointment = require('../appointments/appointment.model');
const ContactMessage = require('../notification/contact-message.model');
const Hospital = require('../hospital/hospital.model');
const { buildHospitalInsights } = require('./hospital-insights');
const { sendError } = require('../common/middleware/error-handler');

// Public, aggregate-only figures for the homepage stats bar — counts and nothing else,
// so it is safe without authentication. (The admin dashboard uses GET / below.)
router.get('/public', async (req, res) => {
  try {
    const [donors, donationTotals, hospitals, fulfilledRequests] = await Promise.all([
      Donor.countDocuments(),
      Donor.aggregate([{ $group: { _id: null, total: { $sum: '$donationCount' } } }]),
      Hospital.countDocuments(),
      BloodRequest.countDocuments({ status: 'Fulfilled' }),
    ]);
    res.json({ donors, donations: donationTotals[0]?.total || 0, hospitals, fulfilledRequests });
  } catch (err) {
    sendError(res, err, req);
  }
});

// Public, aggregate-only "how are the partner hospitals doing" figures for the About page.
// Counts, totals and hospital names/cities only — never donor, patient or contact details.
// Cached briefly because it is unauthenticated and runs several aggregations.
const INSIGHTS_TTL_MS = 5 * 60 * 1000;
let insightsCache = null; // { t, data }

router.get('/hospital-insights', async (req, res) => {
  try {
    if (!insightsCache || Date.now() - insightsCache.t > INSIGHTS_TTL_MS) {
      insightsCache = { t: Date.now(), data: await buildHospitalInsights() };
    }
    res.json(insightsCache.data);
  } catch (err) {
    sendError(res, err, req);
  }
});
router.clearInsightsCache = () => { insightsCache = null; };

router.get('/', adminAuth, async (req, res) => {
  try {
    const [
      totalDonors, availableDonors,
      totalRequests, pendingRequests, criticalRequests,
      totalAppointments, pendingAppointments,
      totalMessages, bloodTypeBreakdown,
      recentDonors, recentRequests,
      totalHospitals, donationTotals,
    ] = await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ available: true }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'Pending' }),
      BloodRequest.countDocuments({ urgency: 'Critical', status: 'Pending' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'Pending' }),
      ContactMessage.countDocuments(),
      Donor.aggregate([{ $group: { _id: '$bloodType', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Donor.find().sort({ createdAt: -1 }).limit(5).select('fullName bloodType location available createdAt photo').lean(),
      BloodRequest.find().sort({ createdAt: -1 }).limit(5).select('patientName bloodType unitsNeeded urgency status hospitalName createdAt').lean(),
      Hospital.countDocuments(),
      Donor.aggregate([{ $group: { _id: null, total: { $sum: '$donationCount' } } }]),
    ]);

    res.json({
      donors: { total: totalDonors, available: availableDonors, unavailable: totalDonors - availableDonors },
      requests: { total: totalRequests, pending: pendingRequests, critical: criticalRequests },
      appointments: { total: totalAppointments, pending: pendingAppointments },
      messages: { total: totalMessages },
      hospitals: { total: totalHospitals },
      donations: { total: donationTotals[0]?.total || 0 }, // completed donations, summed from each donor's donationCount
      bloodTypeBreakdown: bloodTypeBreakdown.map((b) => ({ type: b._id, count: b.count })),
      recentDonors,
      recentRequests,
    });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
