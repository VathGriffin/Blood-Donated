const multer = require('multer');
const path   = require('path');

// Builds a multer instance storing images under /uploads as
// `<prefix>-<id>-<timestamp>.<ext>`. `getId` extracts the id embedded in the
// filename from the request — defaults to the :id route param.
function createImageUpload(prefix, getId = (req) => req.params.id) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `${prefix}-${getId(req)}-${Date.now()}${path.extname(file.originalname)}`),
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
      file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed')),
  });
}

module.exports = { createImageUpload };
