const express      = require('express');
const helmet       = require('helmet');
const compression  = require('compression');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const fs           = require('fs');
const mongoose     = require('mongoose');

const userRoutes        = require('./users/user.routes');
const staffRoutes       = require('./staff/staff.routes');
const hospitalRoutes    = require('./hospital/hospital.routes');
const donorRoutes       = require('./donor/donor.routes');
const appointmentRoutes = require('./appointments/appointment.routes');
const requestRoutes     = require('./requests/blood-request.routes');
const messageRoutes     = require('./notification/message.routes');
const contactRoutes     = require('./notification/contact.routes');
const chatRoutes        = require('./chatbot/chat.routes');
const statsRoutes       = require('./dashboard/stats.routes');
const homepageRoutes    = require('./homepage/homepage.routes');
const inventoryRoutes   = require('./inventory/inventory.routes');
const analyticsRoutes   = require('./analytics/analytics.routes');
const nearbyRoutes      = require('./nearby/nearby.routes');
const { notFound, errorHandler } = require('./common/middleware/error-handler');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Security & compression
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// Rate limiting — 100 req / 15 min per IP in production, relaxed in development
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// NoSQL injection sanitization — strips $ and . from req.body, req.params, req.query
// Express 5 makes req.query a getter-only property, so we sanitize in place
// instead of using the package's middleware, which reassigns req.query directly.
const mongoSanitize = require('express-mongo-sanitize');
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'BloodLife API', version: '2.0.0' }));

// Chat and nearby-hospital lookup — no DB required
app.use('/api/chat', chatRoutes);
app.use('/api/nearby', nearbyRoutes);

// Block other API calls when DB is unavailable
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1)
    return res.status(503).json({ error: 'Database unavailable', message: 'MongoDB is not connected.' });
  next();
});

// Routes
app.use('/api/staff',        staffRoutes);
app.use('/api/user',         userRoutes);
app.use('/api/hospitals',    hospitalRoutes);
app.use('/api/donors',       donorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/requests',     requestRoutes);
app.use('/api/messages',     messageRoutes);
app.use('/api/contacts',     contactRoutes);
app.use('/api/stats',        statsRoutes);
app.use('/api/homepage',     homepageRoutes);
app.use('/api/inventory',    inventoryRoutes);
app.use('/api/analytics',    analyticsRoutes);

// Unknown routes get JSON (Express's default is an HTML page), then the global handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
