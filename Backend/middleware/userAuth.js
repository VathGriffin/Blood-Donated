const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        if (decoded.role !== 'user') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
