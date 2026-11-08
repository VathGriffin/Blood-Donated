// Input rules shared by forms across the app.

import { currentLang } from '@/i18n/config';
import { translate } from '@/i18n/translate';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Image uploads: must match the multer setup in Backend/src/common/upload.js.
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Why `file` can't be uploaded as a photo, or null when it can.
export function photoFileError(file) {
  // Same texts as the hospital profile page (hosp.profile.*), in the selected language.
  if (!PHOTO_TYPES.includes(file.type)) return translate(currentLang(), 'hosp.profile.photoType');
  if (file.size > MAX_PHOTO_SIZE) return translate(currentLang(), 'hosp.profile.photoSize', { max: MAX_PHOTO_SIZE / (1024 * 1024) });
  return null;
}

// Phone numbers as people type them ("+855 12 345 678", "0901-234-567"): 8–15 digits, with
// optional spaces, dashes, dots, brackets and a leading +.
export const isPhone = (value) => {
  const v = String(value || '').trim();
  const digits = v.replace(/\D/g, '');
  return /^\+?[\d\s\-().]+$/.test(v) && digits.length >= 8 && digits.length <= 15;
};
