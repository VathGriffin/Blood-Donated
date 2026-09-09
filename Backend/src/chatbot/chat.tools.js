const mongoose = require('mongoose');
const Inventory = require('../inventory/inventory.model');
const BloodRequest = require('../requests/blood-request.model');
const Appointment = require('../appointments/appointment.model');

const ELIGIBILITY_INTERVAL_DAYS = 56;

const tools = [
  {
    name: 'get_inventory_levels',
    description: 'Get current blood inventory levels across all blood types at the central blood bank. Use when the user asks about blood availability, shortages, or which types are needed most.',
    input_schema: { type: 'object', properties: {}, required: [] },
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
  const items = await Inventory.find({ hospital: null }).lean({ virtuals: true });
  return items.map((i) => ({ bloodType: i.bloodType, units: i.units, status: i.status }));
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
  const days = Math.floor((Date.now() - new Date(last_donation_date).getTime()) / 86400000);
  const eligible = days >= ELIGIBILITY_INTERVAL_DAYS;
  return {
    eligible,
    daysSinceLastDonation: days,
    nextEligibleDate: eligible
      ? null
      : new Date(new Date(last_donation_date).getTime() + ELIGIBILITY_INTERVAL_DAYS * 86400000).toISOString(),
  };
}

async function executeTool(name, input, authUser) {
  switch (name) {
    case 'get_inventory_levels': return getInventoryLevels();
    case 'get_my_requests': return getMyRequests(authUser);
    case 'get_my_appointments': return getMyAppointments(authUser);
    case 'check_donor_eligibility': return checkDonorEligibility(input);
    default: return { error: `Unknown tool: ${name}` };
  }
}

module.exports = { tools, executeTool };
