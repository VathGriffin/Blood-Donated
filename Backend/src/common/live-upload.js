const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// A stored photo path ("/uploads/donor-….jpg") whose file is no longer on disk — e.g. the uploads
// folder was cleared or the database was copied from another machine — would make every browser
// request it and get a 404. Report such a photo as missing (null) so pages show initials instead.
// The database is not changed. Full URLs (external photos) are passed through untouched.
const isUploadPath = (photo) => typeof photo === 'string' && photo.startsWith('/uploads/');

function checkPhoto(photo, exists) {
  if (!photo || typeof photo !== 'string') return null;
  if (!isUploadPath(photo)) return photo;
  return exists(path.basename(photo)) ? photo : null;
}

/** One photo (single-record routes). */
function liveUpload(photo) {
  return checkPhoto(photo, (name) => fs.existsSync(path.join(UPLOADS_DIR, name)));
}

/**
 * The same check for a whole list (e.g. the donor directory): the uploads folder is listed once,
 * asynchronously, instead of one blocking disk check per record. Returns a `liveUpload`-like
 * function. If the folder can't be read, every uploaded photo counts as missing.
 */
async function liveUploadChecker(photos = []) {
  if (!photos.some(isUploadPath)) return (photo) => checkPhoto(photo, () => false);
  let files;
  try {
    files = new Set(await fs.promises.readdir(UPLOADS_DIR));
  } catch {
    files = new Set();
  }
  return (photo) => checkPhoto(photo, (name) => files.has(name));
}

module.exports = { liveUpload, liveUploadChecker };
