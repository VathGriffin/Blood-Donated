const mongoose = require('mongoose');
const Inventory = require('../inventory/inventory.model');
const BloodRequest = require('../requests/blood-request.model');
const Appointment = require('../appointments/appointment.model');
const Hospital = require('../hospital/hospital.model');
const { computeEligibility } = require('../common/eligibility');
const { buildHospitalInsights } = require('../dashboard/hospital-insights');

const tools = [
  {
    name: 'get_inventory_levels',
    description: 'Get current blood inventory levels across all blood types at the central blood bank. Use when the user asks about blood availability, shortages, or which types are needed most.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_network_insights',
    description: 'Get anonymous, platform-wide figures: number of partner hospitals, blood requests (total, fulfilled, by urgency and blood type), blood stock across all hospitals by type, and appointments checked in. Use for questions like which blood type is most needed or scarcest, how many hospitals there are, or how the platform is doing.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'find_partner_hospitals',
    description: 'List the partner hospitals registered on the platform (name, city, address, phone), optionally filtered by a city or province. If none are returned, tell the user none are listed yet and point them to the Find a Hospital map page.',
    input_schema: {
      type: 'object',
      properties: { city: { type: 'string', description: 'City or province to filter by, e.g. "Siem Reap". Omit to list all.' } },
      required: [],
    },
  },
  {
    name: 'get_my_requests',
    description: "Get the authenticated user's own blood requests and their status (Pending, Approved, Rejected, Fulfilled). Only works if the user is logged in as a donor; if not, tell them to log in.",
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_my_appointments',
    description: "Get the authenticated user's own upcoming and past donation appointments. Only works if the user is logged in as a donor; if not, tell them to log in.",
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'check_donor_eligibility',
    description: 'Check whether someone is currently eligible to donate whole blood, based on their last donation date and the standard 56-day donation interval.',
    input_schema: {
      type: 'object',
      properties: {
        last_donation_date: {
          type: 'string',
          description: 'ISO date string of the last donation. Omit if they have never donated before.',
        },
      },
      required: [],
    },
  },
];

const dbUnavailable = (label) => ({ error: `${label} is temporarily unavailable — the database is not connected right now.` });

async function getInventoryLevels() {
  if (mongoose.connection.readyState !== 1) return dbUnavailable('Inventory data');
  // Not .lean() — the `status` field is a schema virtual, which only computes on
  // hydrated documents (lean() skips it, "virtuals: true" isn't a real lean option).
  const items = await Inventory.find({ hospital: null });
  return items.map((i) => ({ bloodType: i.bloodType, units: i.units, status: i.status }));
}

async function getNetworkInsights() {
  if (mongoose.connection.readyState !== 1) return dbUnavailable('Platform figures');
  return buildHospitalInsights();
}

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findPartnerHospitals({ city } = {}) {
  if (mongoose.connection.readyState !== 1) return dbUnavailable('Hospital data');
  const term = typeof city === 'string' ? city.trim().slice(0, 60) : '';
  const filter = term
    ? { $or: ['city', 'address', 'name'].map((field) => ({ [field]: new RegExp(escapeRegex(term), 'i') })) }
    : {};
  // name / city / address / phone only — the hospital's email and licence number stay private
  const rows = await Hospital.find(filter).select('name city address phone').sort({ name: 1 }).limit(10).lean();
  return {
    count: rows.length,
    hospitals: rows.map((h) => ({ name: h.name, city: h.city, address: h.address, phone: h.phone })),
    ...(rows.length ? {} : { note: 'No partner hospitals are registered for that search. Suggest the Find a Hospital map page (/map), which shows real hospitals and clinics nearby.' }),
  };
}

async function getMyRequests(authUser) {
  if (!authUser) return { error: 'Not logged in — ask the user to log in to see their own requests.' };
  if (mongoose.connection.readyState !== 1) return dbUnavailable('Request data');
  return BloodRequest.find({ userEmail: authUser.email })
    .select('bloodType status urgency unitsNeeded hospitalName createdAt')
    .sort({ createdAt: -1 })
    .lean();
}

async function getMyAppointments(authUser) {
  if (!authUser) return { error: 'Not logged in — ask the user to log in to see their own appointments.' };
  if (mongoose.connection.readyState !== 1) return dbUnavailable('Appointment data');
  return Appointment.find({ email: authUser.email })
    .select('bloodType date time location status')
    .sort({ createdAt: -1 })
    .lean();
}

function checkDonorEligibility({ last_donation_date } = {}) {
  if (!last_donation_date) return { eligible: true, reason: 'No prior donation on record.' };
  return computeEligibility(last_donation_date);
}

async function executeTool(name, input, authUser) {
  switch (name) {
    case 'get_inventory_levels': return getInventoryLevels();
    case 'get_network_insights': return getNetworkInsights();
    case 'find_partner_hospitals': return findPartnerHospitals(input);
    case 'get_my_requests': return getMyRequests(authUser);
    case 'get_my_appointments': return getMyAppointments(authUser);
    case 'check_donor_eligibility': return checkDonorEligibility(input);
    default: return { error: `Unknown tool: ${name}` };
  }
}

module.exports = { tools, executeTool };
