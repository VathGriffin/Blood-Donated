// A hospital_staff may only act on records assigned to their own hospital.
// Admins (no req.staff) are unrestricted.
const assertHospitalScope = (req, doc) => {
  if (!req.staff) return true;
  return doc.hospital && String(doc.hospital) === String(req.staff.hospitalId);
};

module.exports = { assertHospitalScope };
