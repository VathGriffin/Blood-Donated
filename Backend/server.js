const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const bloodRequestRoutes = require('./routes/bloodRequests');
const donorRoutes = require('./routes/donors');
const contactRoutes = require('./routes/contactMessages'); // ✅ thêm dòng này

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('🩸 Blood Donation API is running');
});

app.use('/api/requests', bloodRequestRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/contacts', contactRoutes);

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });
