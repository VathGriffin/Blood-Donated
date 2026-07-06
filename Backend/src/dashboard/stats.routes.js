const express = require('express');
const router = express.Router();
const adminAuth = require('../common/middleware/admin-auth');
const Donor = require('../donor/donor.model');
const BloodRequest = require('../requests/blood-request.model');
const Appointment = require('../appointments/appointment.model');
const ContactMessage = require('../notification/contact-message.model');

router.get('/', adminAuth, async (req, res) => {
  try {
    const [
      totalDonors, availableDonors,
      totalRequests, pendingRequests, criticalRequests,
      totalAppointments, pendingAppointments,
      totalMessages, bloodTypeBreakdown,
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
    ]);

    const [recentDonors, recentRequests] = await Promise.all([
      Donor.find().sort({ createdAt: -1 }).limit(5).select('fullName bloodType location available createdAt photo'),
      BloodRequest.find().sort({ createdAt: -1 }).limit(5).select('patientName bloodType urgency status hospitalName createdAt'),
    ]);

    res.json({
      donors: { total: totalDonors, available: availableDonors, unavailable: totalDonors - availableDonors },
      requests: { total: totalRequests, pending: pendingRequests, critical: criticalRequests },
      appointments: { total: totalAppointments, pending: pendingAppointments },
      messages: { total: totalMessages },
      bloodTypeBreakdown: bloodTypeBreakdown.map((b) => ({ type: b._id, count: b.count })),
      recentDonors,
      recentRequests,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
