const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const StaffUser = require('../src/staff/staff.model');
const Hospital = require('../src/hospital/hospital.model');

const signStaff = (staff) =>
  jwt.sign(
    {
      id: staff._id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role,
      hospitalId: staff.hospital ? staff.hospital.toString() : undefined,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const signDonor = (donor) =>
  jwt.sign(
    { id: donor._id || donor.id, email: donor.email, fullName: donor.fullName, role: 'donor' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

async function createHospital(overrides = {}) {
  return Hospital.create({ name: 'Calmette Hospital', city: 'Phnom Penh', ...overrides });
}

async function createAdmin(overrides = {}) {
  const staff = await StaffUser.create({
    fullName: 'Test Admin',
    email: 'admin@test.com',
    password: await bcrypt.hash('password123', 10),
    role: 'admin',
    ...overrides,
  });
  return { staff, token: signStaff(staff) };
}

async function createHospitalStaff(hospitalId, overrides = {}) {
  const staff = await StaffUser.create({
    fullName: 'Test Hospital Staff',
    email: 'staff@test.com',
    password: await bcrypt.hash('password123', 10),
    role: 'hospital_staff',
    hospital: hospitalId,
    ...overrides,
  });
  return { staff, token: signStaff(staff) };
}

module.exports = { signStaff, signDonor, createHospital, createAdmin, createHospitalStaff };
