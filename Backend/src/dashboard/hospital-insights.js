const Hospital = require('../hospital/hospital.model');
const BloodRequest = require('../requests/blood-request.model');
const Appointment = require('../appointments/appointment.model');
const Inventory = require('../inventory/inventory.model');
const { BLOOD_TYPES } = require('../common/blood-types');

// Aggregate-only "how are the partner hospitals doing" figures — counts, totals and hospital
// names/cities, never donor, patient or contact details. Shared by the public About-page
// endpoint (stats.routes.js) and the AI assistant's network-insights tool (chat.tools.js).
const stockStatus = ({ units, minUnits }) => {
  if (units === 0) return 'empty';
  if (units < minUnits) return 'critical';
  if (units < minUnits * 2) return 'low';
  return 'adequate';
};

async function buildHospitalInsights() {
  const [hospitals, requestsByStatus, requestsByUrgency, requestsByType, appointmentsByStatus, stockRows, topHospitals] =
    await Promise.all([
      Hospital.countDocuments(),
      BloodRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      BloodRequest.aggregate([{ $group: { _id: '$urgency', count: { $sum: 1 } } }]),
      BloodRequest.aggregate([{ $group: { _id: '$bloodType', count: { $sum: 1 } } }]),
      Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Inventory.find().select('bloodType units minUnits hospital').lean(),
      BloodRequest.aggregate([
        { $match: { hospital: { $ne: null } } },
        { $group: { _id: '$hospital', requests: { $sum: 1 }, fulfilled: { $sum: { $cond: [{ $eq: ['$status', 'Fulfilled'] }, 1, 0] } } } },
        { $sort: { fulfilled: -1, requests: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'hospitals', localField: '_id', foreignField: '_id', as: 'h' } },
        { $unwind: '$h' },
        { $project: { _id: 0, name: '$h.name', city: '$h.city', requests: 1, fulfilled: 1 } },
      ]),
    ]);

  const countOf = (rows, key) => rows.find((r) => r._id === key)?.count || 0;
  const requestTotal = requestsByStatus.reduce((sum, r) => sum + r.count, 0);

  const stockByType = Object.fromEntries(BLOOD_TYPES.map((t) => [t, 0]));
  const status = { adequate: 0, low: 0, critical: 0, empty: 0 };
  const reporting = new Set();
  for (const row of stockRows) {
    stockByType[row.bloodType] += row.units || 0;
    status[stockStatus({ units: row.units || 0, minUnits: row.minUnits ?? 10 })] += 1;
    if (row.hospital) reporting.add(String(row.hospital));
  }

  return {
    hospitals,
    hospitalsReportingStock: reporting.size,
    requests: {
      total: requestTotal,
      fulfilled: countOf(requestsByStatus, 'Fulfilled'),
      rejected: countOf(requestsByStatus, 'Rejected'),
      pending: countOf(requestsByStatus, 'Pending') + countOf(requestsByStatus, 'Approved'),
      byUrgency: ['Critical', 'High', 'Medium', 'Low'].map((urgency) => ({ urgency, count: countOf(requestsByUrgency, urgency) })),
      byBloodType: BLOOD_TYPES.map((type) => ({ type, count: countOf(requestsByType, type) })),
    },
    appointments: {
      total: appointmentsByStatus.reduce((sum, r) => sum + r.count, 0),
      checkedIn: countOf(appointmentsByStatus, 'CheckedIn'),
    },
    stock: {
      totalUnits: Object.values(stockByType).reduce((a, b) => a + b, 0),
      byBloodType: BLOOD_TYPES.map((type) => ({ type, units: stockByType[type] })),
      status,
    },
    topHospitals,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { buildHospitalInsights };
