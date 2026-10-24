const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// A stored photo path ("/uploads/donor-….jpg") whose file is no longer on disk — e.g. the uploads
// folder was cleared or the database was copied from another machine — would make every browser
// request it and get a 404. Report such a photo as missing (null) so pages show initials instead.
// The database is not changed. Full URLs (external photos) are passed through untouched.
function liveUpload(photo) {
  if (!photo || typeof photo !== 'string') return null;
  if (!photo.startsWith('/uploads/')) return photo;
  return fs.existsSync(path.join(UPLOADS_DIR, path.basename(photo))) ? photo : null;
}

module.exports = { liveUpload };
