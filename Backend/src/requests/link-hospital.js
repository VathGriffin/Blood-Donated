const Hospital = require('../hospital/hospital.model');
const BloodRequest = require('./blood-request.model');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameMatcher = (name) => new RegExp(`^\\s*${escapeRegex(name.trim())}\\s*$`, 'i');

// Requests are filed with a hospital *name* (the public form and the admin form both send text).
// Hospital staff only see requests linked to their hospital's id, so look the name up and return
// that id — or null when no registered hospital has that name (it stays an admin-only request).
async function findHospitalIdByName(name) {
  if (typeof name !== 'string' || !name.trim()) return null;
  const hospital = await Hospital.findOne({ name: nameMatcher(name) }).select('_id').lean();
  return hospital?._id || null;
}

// Links requests saved before this lookup existed (hospital: null) to the hospital whose name
// they carry. Safe to run on every start: already-linked requests are never touched.
async function linkUnassignedRequests() {
  const hospitals = await Hospital.find().select('_id name').lean();
  let linked = 0;
  for (const h of hospitals) {
    if (!h.name?.trim()) continue;
    const { modifiedCount } = await BloodRequest.updateMany(
      { hospital: null, hospitalName: nameMatcher(h.name) },
      { $set: { hospital: h._id } }
    );
    linked += modifiedCount;
  }
  return linked;
}

module.exports = { findHospitalIdByName, linkUnassignedRequests };
