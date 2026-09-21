const express = require('express');
const router  = express.Router();
const Donor        = require('../donor/donor.model');
const BloodRequest = require('../requests/blood-request.model');
const Appointment  = require('../appointments/appointment.model');
const Inventory    = require('../inventory/inventory.model');
const { requireRole } = require('../common/middleware/require-role');
const { sendError } = require('../common/middleware/error-handler');
const adminAuth = requireRole('admin');

router.use(adminAuth);

// GET comprehensive analytics
router.get('/', async (req, res) => {
  try {
    const now   = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const year  = new Date(now.getFullYear(), 0, 1);

    const [
      totalDonors, newDonorsThisMonth, activeDonors,
      totalRequests, pendingRequests, fulfilledRequests, urgentRequests,
      totalAppointments, appointmentsThisMonth,
      inventory,
      donorsByBloodType,
      requestsByBloodType,
      requestsByStatus,
      monthlyDonors,
      monthlyRequests,
    ] = await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ createdAt: { $gte: month } }),
      Donor.countDocuments({ available: true }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'Pending' }),
      BloodRequest.countDocuments({ status: 'Fulfilled' }),
      BloodRequest.countDocuments({ urgency: 'Critical', status: 'Pending' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ createdAt: { $gte: month } }),
      Inventory.find(),
      Donor.aggregate([{ $group: { _id: '$bloodType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      BloodRequest.aggregate([{ $group: { _id: '$bloodType', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      BloodRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      // Monthly donor signups (last 6 months)
      Donor.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Monthly requests (last 6 months)
      BloodRequest.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const totalInventory = inventory.reduce((s, i) => s + i.units, 0);
    const criticalTypes  = inventory.filter(i => i.status === 'critical' || i.status === 'empty');
    const fulfillmentRate = totalRequests > 0
      ? Math.round((fulfilledRequests / totalRequests) * 100)
      : 0;

    res.json({
      overview: {
        totalDonors, newDonorsThisMonth, activeDonors,
        totalRequests, pendingRequests, fulfilledRequests, urgentRequests,
        totalAppointments, appointmentsThisMonth,
        totalInventoryUnits: totalInventory,
        criticalBloodTypes: criticalTypes.map(i => i.bloodType),
        fulfillmentRate,
      },
      charts: {
        donorsByBloodType: donorsByBloodType.map(d => ({ bloodType: d._id, count: d.count })),
        requestsByBloodType: requestsByBloodType.map(d => ({ bloodType: d._id, count: d.count })),
        requestsByStatus: requestsByStatus.map(d => ({ status: d._id, count: d.count })),
        inventory: inventory.map(i => ({ bloodType: i.bloodType, units: i.units, status: i.status })),
        monthlyDonors,
        monthlyRequests,
      },
    });
  } catch (err) {
    sendError(res, err, req);
  }
});

module.exports = router;
