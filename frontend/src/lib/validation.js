// Input rules shared by forms across the app.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Image uploads: must match the multer setup in Backend/src/common/upload.js.
export const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Why `file` can't be uploaded as a photo, or null when it can.
export function photoFileError(file) {
  if (!PHOTO_TYPES.includes(file.type)) return 'Please choose a JPG, PNG, WebP or GIF image.';
  if (file.size > MAX_PHOTO_SIZE) return `Image is too large — max ${MAX_PHOTO_SIZE / (1024 * 1024)} MB.`;
  return null;
}
