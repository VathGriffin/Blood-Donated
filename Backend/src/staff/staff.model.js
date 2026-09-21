const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Invalid email address'],
    },
    password: { type: String, required: true },
    photo: { type: String, default: null },
    role: { type: String, enum: ['admin', 'hospital_staff'], required: true },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: function () { return this.role === 'hospital_staff'; },
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffUser', staffSchema);
