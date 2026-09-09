const express = require('express');
const router = express.Router();
const Appointment = require('./appointment.model');
const Donor = require('../donor/donor.model');
const { requireRole } = require('../common/middleware/require-role');

const assertHospitalScope = (req, appt) => {
  if (!req.staff) return true;
  return appt.hospital && String(appt.hospital) === String(req.staff.hospitalId);
};

router.post('/', async (req, res) => {
  try {
    res.status(201).json(await new Appointment(req.body).save());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.hospital) filter.hospital = req.query.hospital;
    res.json(await Appointment.find(filter).sort({ createdAt: -1 }).lean());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).lean();
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
