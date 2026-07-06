const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const { connect } = require('./src/config/database');

const authRoutes        = require('./src/auth/auth.routes');
const userRoutes        = require('./src/users/user.routes');
const donorRoutes       = require('./src/donor/donor.routes');
const appointmentRoutes = require('./src/appointments/appointment.routes');
const requestRoutes     = require('./src/requests/blood-request.routes');
const messageRoutes     = require('./src/notification/message.routes');
const contactRoutes     = require('./src/notification/contact.routes');
const chatRoutes        = require('./src/chatbot/chat.routes');
const statsRoutes       = require('./src/dashboard/stats.routes');

const app = express();
const PORT = process.env.PORT || 3001;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'] }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadsDir));

// Chat does not require MongoDB
app.use('/api/chat', chatRoutes);

// Block other API calls when DB is unavailable
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1)
    return res.status(503).json({ error: 'Database unavailable', message: 'MongoDB is not connected.' });
  next();
});

app.get('/', (req, res) => res.send('🩸 Blood Donation API is running'));

app.use('/api/auth',         authRoutes);
app.use('/api/user',         userRoutes);
app.use('/api/donors',       donorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/requests',     requestRoutes);
app.use('/api/messages',     messageRoutes);
app.use('/api/contacts',     contactRoutes);
app.use('/api/stats',        statsRoutes);

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

connect();
