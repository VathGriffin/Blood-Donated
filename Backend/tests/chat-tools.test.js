const { executeTool } = require('../src/chatbot/chat.tools');
const Inventory = require('../src/inventory/inventory.model');
const BloodRequest = require('../src/requests/blood-request.model');
const Appointment = require('../src/appointments/appointment.model');

describe('chatbot tool execution', () => {
  test('get_inventory_levels returns central (non-hospital) stock only', async () => {
    await Inventory.create({ bloodType: 'O+', hospital: null, units: 12 });
    await Inventory.create({ bloodType: 'O+', hospital: '666666666666666666666666', units: 99 });

    const result = await executeTool('get_inventory_levels', {}, null);
    expect(result).toEqual([{ bloodType: 'O+', units: 12, status: expect.any(String) }]);
  });

  test('get_my_requests requires a logged-in user', async () => {
    const result = await executeTool('get_my_requests', {}, null);
    expect(result.error).toBeDefined();
  });

  test('get_my_requests returns only the caller\'s own requests', async () => {
    await BloodRequest.create({
      hospitalName: 'Calmette', patientName: 'Me', bloodType: 'O+', unitsNeeded: 1,
      urgency: 'Low', reason: 'checkup', status: 'Pending', userEmail: 'me@test.com',
    });
    await BloodRequest.create({
      hospitalName: 'Calmette', patientName: 'Someone Else', bloodType: 'O+', unitsNeeded: 1,
      urgency: 'Low', reason: 'checkup', status: 'Pending', userEmail: 'other@test.com',
    });

    const result = await executeTool('get_my_requests', {}, { email: 'me@test.com' });
    expect(result.length).toBe(1);
    expect(result[0].hospitalName).toBe('Calmette');
  });

  test('get_my_appointments requires a logged-in user', async () => {
    const result = await executeTool('get_my_appointments', {}, null);
    expect(result.error).toBeDefined();
  });

  test('get_my_appointments returns only the caller\'s own appointments', async () => {
    await Appointment.create({
      fullName: 'Me', email: 'me@test.com', phone: '1', bloodType: 'O+',
      date: '2026-01-01', time: '09:00 AM', location: 'Calmette Hospital',
    });
    const result = await executeTool('get_my_appointments', {}, { email: 'me@test.com' });
    expect(result.length).toBe(1);
  });

  test('check_donor_eligibility: no prior donation is always eligible', async () => {
    const result = await executeTool('check_donor_eligibility', {}, null);
    expect(result.eligible).toBe(true);
  });

  test('check_donor_eligibility: recent donation is not yet eligible', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const result = await executeTool('check_donor_eligibility', { last_donation_date: yesterday }, null);
    expect(result.eligible).toBe(false);
    expect(result.nextEligibleDate).toBeDefined();
  });

  test('check_donor_eligibility: 60 days ago is eligible again', async () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();
    const result = await executeTool('check_donor_eligibility', { last_donation_date: sixtyDaysAgo }, null);
    expect(result.eligible).toBe(true);
  });

  test('unknown tool name returns an error instead of throwing', async () => {
    const result = await executeTool('not_a_real_tool', {}, null);
    expect(result.error).toBeDefined();
  });
});
