const isProduction = () => process.env.NODE_ENV === 'production';

// Maps the errors this app actually produces (Mongoose, JWT, multer, body-parser)
// to a client-safe { status, text }. Anything unrecognised is a 500 whose real
// message stays in the server log — in production the client only sees a generic one,
// so model names, field paths and driver internals never leak.
function classify(err) {
  if (err.name === 'CastError') {
    const field = err.path === '_id' ? 'id' : err.path;
    return { status: 400, text: `Invalid ${field}` };
  }
  if (err.name === 'ValidationError' && err.errors) {
    const text = Object.values(err.errors).map((e) => e.message).join(', ');
    return { status: 400, text: text || 'Validation failed' };
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    return { status: 409, text: field ? `A record with that ${field} already exists` : 'Duplicate record' };
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return { status: 401, text: 'Invalid or expired token' };
  }
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') return { status: 413, text: 'File is too large — max 10 MB' };
    return { status: 400, text: err.message };
  }
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) return { status, text: err.message };
  return {
    status: 500,
    text: isProduction() ? 'Internal server error' : err.message || 'Internal server error',
  };
}

// Route handlers are split between `{ message }` and `{ error }` response shapes,
// and frontend pages read whichever one their route uses — so every error carries
// both keys, otherwise it silently renders as "undefined" client-side.
function sendError(res, err, req) {
  const { status, text } = classify(err);
  if (status >= 500) {
    const where = req ? `${req.method} ${req.originalUrl || req.path}` : 'route handler';
    console.error(`[ERROR] ${where}:`, err.stack || err);
  }
  if (res.headersSent) return;
  res.status(status).json({
    message: text,
    error: text,
    ...(process.env.NODE_ENV === 'development' && status >= 500 && { stack: err.stack }),
  });
}

const notFound = (req, res) => {
  const text = `Route not found: ${req.method} ${req.path}`;
  res.status(404).json({ message: text, error: text });
};

// Express recognises an error handler by its four parameters, so `next` must stay in the signature.
const errorHandler = (err, req, res, next) => sendError(res, err, req);

module.exports = { sendError, notFound, errorHandler };
