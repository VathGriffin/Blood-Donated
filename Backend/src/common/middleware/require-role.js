const { verifySessionToken } = require('../session');

const attachAliases = (req, decoded) => {
  req.auth = decoded;
  if (decoded.role === 'admin') req.admin = decoded;
  if (decoded.role === 'donor') req.user = decoded;
  if (decoded.role === 'hospital_staff') req.staff = decoded;
};

const requireRole = (...roles) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = verifySessionToken(header.slice(7));
    if (roles.length && !roles.includes(decoded.role))
      return res.status(403).json({ message: 'Forbidden' });
    attachAliases(req, decoded);
    next();
  } catch (err) {
    res.status(401).json({ message: err.name === 'SessionEndedError' ? err.message : 'Invalid or expired token' });
  }
};

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const decoded = verifySessionToken(header.slice(7));
    attachAliases(req, decoded);
  } catch {
    // ignore invalid token on optional path
  }
  next();
};

module.exports = { requireRole, optionalAuth };
