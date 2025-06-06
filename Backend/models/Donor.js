const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^0\d{9,10}$/, 'Please enter a valid phone number'],
  },
  bloodType: {
    type: String,
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      message: '{VALUE} is not a valid blood type',
    },
    required: [true, 'Blood type is required'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
  },
  available: {
    type: Boolean,
    default: false,
  },
  lastDonation: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Donor', donorSchema);
