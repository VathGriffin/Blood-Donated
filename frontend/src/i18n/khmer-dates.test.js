import { formatKhmer } from './khmer-dates';
import './config';

const d = new Date(2025, 2, 12, 14, 5);

test('Khmer month and weekday names, day-month-year order', () => {
  expect(formatKhmer(d, { day: 'numeric', month: 'short', year: 'numeric' })).toBe('12 មីនា 2025');
  expect(formatKhmer(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })).toBe('ពុធ 12 មីនា 2025');
  expect(formatKhmer(d, { month: 'long', year: 'numeric' })).toBe('មីនា 2025');
  expect(formatKhmer(d, { hour: 'numeric', minute: '2-digit' }, 'time')).toBe('2:05 PM');
  expect(formatKhmer(d)).toBe('12/3/2025');
});

test('the Date methods use it for Khmer only', () => {
  expect(d.toLocaleDateString('km-KH', { day: 'numeric', month: 'short', year: 'numeric' })).toBe('12 មីនា 2025');
  expect(d.toLocaleString('km-KH', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })).toBe('12 មីនា 2:05 PM');
  expect(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })).toBe('Mar 12, 2025');
  expect(d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })).toBe('12 thg 3, 2025');
});
