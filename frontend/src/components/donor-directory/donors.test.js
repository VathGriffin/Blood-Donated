import { citiesOf, cityOf, isReady, prepareDonors, queryDirectory, registrationTrend } from './donors';

const DAY = 86400000;
const NOW = Date.now();
const ago = (days) => new Date(NOW - days * DAY).toISOString();

const donors = prepareDonors([
  { _id: '1', fullName: 'Vanna', bloodType: 'A-', location: 'Street 271, Phnom Penh', available: true, lastDonation: ago(100), createdAt: ago(5), donationCount: 3 },
  { _id: '2', fullName: 'Bopha', bloodType: 'O-', location: 'phnom penh, Cambodia', available: true, lastDonation: ago(10), createdAt: ago(20), donationCount: 1 },
  { _id: '3', fullName: 'Dara', bloodType: 'O+', location: 'Siem Reap', available: false, lastDonation: null, createdAt: ago(45), donationCount: 0 },
  { _id: '4', fullName: 'Sophea', bloodType: 'AB+', location: '', available: true, lastDonation: null, createdAt: ago(200), donationCount: 5 },
]);
const ids = (filters, sortBy) => queryDirectory(donors, filters, sortBy).rows.map((d) => d._id);

test('cityOf takes the last part of the location, ignoring case and the country', () => {
  expect(cityOf('Street 271, Phnom Penh')).toBe('Phnom Penh');
  expect(cityOf('phnom penh, Cambodia')).toBe('Phnom Penh');
  expect(cityOf('')).toBe('');
  expect(citiesOf(donors)).toEqual([{ name: 'Phnom Penh', count: 2 }, { name: 'Siem Reap', count: 1 }]);
});

test('ready means available and past the 56-day donation interval', () => {
  expect(donors.map(isReady)).toEqual([true, false, false, true]);
  expect(donors.map((d) => d._ready)).toEqual([true, false, false, true]);
});

test('filters by availability, city and search on name or location', () => {
  expect(ids({ availability: 'available' })).toEqual(['1', '2', '4']);
  expect(ids({ availability: 'ready' })).toEqual(['1', '4']);
  expect(ids({ city: 'Phnom Penh' })).toEqual(['1', '2']);
  expect(ids({ search: ' SIEM ' })).toEqual(['3']);
  expect(ids({ search: 'vanna' })).toEqual(['1']);
  // A search never matches across the name and the location.
  expect(ids({ search: 'dara siem' })).toEqual([]);
});

test('a blood type matches exactly, or every compatible donor type', () => {
  expect(ids({ bloodType: 'A+' })).toEqual([]);
  // A+ patients can receive from A+, A-, O+ and O-.
  expect(ids({ bloodType: 'A+', compatible: true })).toEqual(['1', '2', '3']);
});

test('tab counts ignore availability; blood type counts ignore the blood type', () => {
  const { tabCounts, typeCounts } = queryDirectory(donors, { availability: 'ready', bloodType: 'O-' });
  expect(tabCounts).toEqual({ all: 1, available: 1, ready: 0 });
  expect(typeCounts).toEqual({ 'A-': { total: 1, available: 1 }, 'AB+': { total: 1, available: 1 } });
});

test('sorts by name, donations, last donation and registration', () => {
  expect(ids({}, 'name')).toEqual(['2', '3', '4', '1']);
  expect(ids({}, 'donations')).toEqual(['4', '1', '2', '3']);
  expect(ids({}, 'lastDonation')[0]).toBe('2');
  expect(ids({}, 'recent')).toEqual(['1', '2', '3', '4']);
});

test('registration trend compares the last 30 days with the 30 before', () => {
  expect(registrationTrend(donors, { now: NOW })).toMatchObject({ current: 2, previous: 1, change: 100 });
});
