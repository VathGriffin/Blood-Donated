const mongoose = require('mongoose');

const connect = () => {
  mongoose.set('bufferCommands', false);
  mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/blood-donation', {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
      console.error('⚠️  MongoDB connection failed:', err.message);
      console.error('   Fix: check your Atlas cluster at https://cloud.mongodb.com');
      console.error('   Make sure the cluster is running and your IP is whitelisted.');
    });
};

module.exports = { connect };
