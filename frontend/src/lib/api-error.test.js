import { apiErrorMessage, translateServerMessage } from './api-error';
import { setCurrentLang } from '@/i18n/config';
import SERVER from '@/i18n/messages/server';

const fail = (body) => ({ response: { status: 400, data: body } });

afterEach(() => setCurrentLang('en'));

test('server text is shown in the selected language', () => {
  setCurrentLang('km');
  expect(apiErrorMessage(fail({ message: 'Invalid email or password.' }), 'x')).toBe(SERVER.km.invalidEmailPassword);
  setCurrentLang('vi');
  expect(apiErrorMessage(fail({ error: 'Appointment not found' }), 'x')).toBe(SERVER.vi.appointmentNotFound);
  setCurrentLang('en');
  expect(apiErrorMessage(fail({ message: 'Invalid email or password.' }), 'x')).toBe('Invalid email or password.');
});

test('straight and curly apostrophes match the same message', () => {
  expect(translateServerMessage("Not your hospital's appointment", 'vi')).toBe(SERVER.vi.notYourHospitalAppointment);
});

test('numbers in templated messages are carried over', () => {
  expect(translateServerMessage('Messages can be at most 2000 characters.', 'vi')).toBe('Tin nhắn tối đa 2000 ký tự.');
  expect(translateServerMessage('This request has already been approved.', 'km')).toBe(SERVER.km.requestAlreadyDone);
});

test('unknown text: English as sent, other languages get the translated fallback', () => {
  expect(translateServerMessage('Something new', 'en', 'Failed')).toBe('Something new');
  expect(translateServerMessage('Something new', 'km', 'បរាជ័យ')).toBe('បរាជ័យ');
  expect(translateServerMessage('Something new', 'km')).toBe('Something new');
});

test('validator errors and a missing server are translated too', () => {
  setCurrentLang('vi');
  expect(apiErrorMessage(fail({ errors: [{ msg: 'Invalid blood type' }] }), 'x')).toBe(SERVER.vi.invalidBloodType);
  expect(apiErrorMessage(new Error('Network Error'), 'x')).toMatch(/^Không thể kết nối/);
});
