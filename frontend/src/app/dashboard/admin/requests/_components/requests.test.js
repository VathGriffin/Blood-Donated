import { filterRequests, noFilters, statusTrend, validateRequestForm } from './requests';

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 6);
const ago = (days) => new Date(NOW - days * DAY).toISOString();

const requests = [
  { _id: '1', patientName: 'Vanna', hospitalName: 'Calmette Hospital', bloodType: 'A-', urgency: 'Medium', status: 'Approved', reason: 'need u', createdAt: ago(2) },
  { _id: '2', patientName: 'Van Nam', hospitalName: 'Angkor Hospital for Children', bloodType: 'AB+', urgency: 'Critical', status: 'Pending', reason: 'surgery', createdAt: ago(40) },
  { _id: '3', patientName: 'Dara', hospitalName: 'Calmette Hospital', bloodType: 'O+', urgency: 'Low', reason: 'anemia', createdAt: ago(10) },
  { _id: '4', patientName: 'Sophea', hospitalName: 'Royal Angkor', bloodType: 'O+', urgency: 'High', status: 'Cancelled', reason: 'x', createdAt: ago(70) },
];

describe('filterRequests', () => {
  test('a tab shows only that status; a request with no status counts as Pending', () => {
    expect(filterRequests(requests, { tab: 'Pending' }).map((r) => r._id)).toEqual(['2', '3']);
    expect(filterRequests(requests, { tab: 'Cancelled' }).map((r) => r._id)).toEqual(['4']);
  });

  test('combines search and filters, case-insensitively', () => {
    expect(filterRequests(requests, { search: '  calmette ' }).map((r) => r._id)).toEqual(['1', '3']);
    expect(filterRequests(requests, { filters: { ...noFilters, bloodType: 'O+', hospital: 'Calmette Hospital' } }).map((r) => r._id)).toEqual(['3']);
    expect(filterRequests(requests, { search: 'nobody' })).toEqual([]);
  });

  test('sorts most urgent first, then newest', () => {
    expect(filterRequests(requests).map((r) => r._id)).toEqual(['2', '4', '1', '3']);
  });
});

describe('validateRequestForm', () => {
  const valid = { patientName: ' Dara ', hospitalName: 'Calmette', bloodType: 'O+', unitsNeeded: 2, urgency: 'High', reason: ' Surgery ', contact: '' };

  test('accepts a valid form and trims the text it sends', () => {
    const { errors, body } = validateRequestForm(valid);
    expect(errors).toEqual({});
    expect(body).toMatchObject({ patientName: 'Dara', reason: 'Surgery', unitsNeeded: 2 });
  });

  test('flags blank, too long and out-of-range fields like the API does', () => {
    const { errors } = validateRequestForm({
      ...valid, patientName: '   ', hospitalName: 'x'.repeat(151), reason: '', contact: 'x'.repeat(101),
      bloodType: '', unitsNeeded: 11, urgency: 'Extreme',
    });
    expect(Object.keys(errors).sort()).toEqual(['bloodType', 'contact', 'hospitalName', 'patientName', 'reason', 'unitsNeeded', 'urgency']);
  });
});

describe('statusTrend', () => {
  test('counts the last 30 days against the 30 before', () => {
    expect(statusTrend(requests, null, { now: NOW })).toMatchObject({ current: 2, previous: 1, change: 100 });
    expect(statusTrend(requests, 'Pending', { now: NOW })).toMatchObject({ current: 1, previous: 1, change: 0 });
  });

  test('has no % change when the previous period was empty', () => {
    const t = statusTrend(requests, 'Approved', { now: NOW });
    expect(t).toMatchObject({ current: 1, previous: 0, change: null });
    expect(t.series.reduce((a, b) => a + b, 0)).toBe(1);
  });
});
