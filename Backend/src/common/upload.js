const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');

// Raster formats only, and the stored extension comes from the mimetype — never from the
// client's filename. Otherwise "evil.html" (or an .svg, which can carry scripts) sent as an
// image would later be served from /uploads as a page on this origin.
const IMAGE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
  'image/gif':  '.gif',
};

// Builds a multer instance storing images under /uploads as
// `<prefix>-<id>-<timestamp>-<random>.<ext>`. `getId` extracts the id embedded in the
// filename from the request — defaults to the :id route param. The random part keeps two
// uploads in the same millisecond from sharing a name, where replacing the old photo would
// delete the new one.
function createImageUpload(prefix, getId = (req) => req.params.id) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `${prefix}-${getId(req)}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${IMAGE_EXTENSIONS[file.mimetype]}`),
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (IMAGE_EXTENSIONS[file.mimetype]) return cb(null, true);
      // status marks this as the client's mistake (400), not a server fault (500)
      cb(Object.assign(new Error('Only JPG, PNG, WebP or GIF images are allowed'), { status: 400 }));
    },
  });
}

module.exports = { createImageUpload };
