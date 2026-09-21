const mongoose = require('mongoose');
const { BLOOD_TYPES } = require('../common/blood-types');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Invalid email address'],
    },
    password: { type: String, minlength: 6 },
    googleId: { type: String, index: { sparse: true } },
    facebookId: { type: String, index: { sparse: true } },
    photo: { type: String, default: null },
    phone: { type: String, default: '' },
    dateOfBirth: { type: Date, default: null },
    bloodType: { type: String, enum: [...BLOOD_TYPES, ''], default: '' },
    location: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
