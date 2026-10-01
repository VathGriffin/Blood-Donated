const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    licenseNumber: { type: String, default: '' },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    // Photo shown on the booking page: an uploaded file (/uploads/...) or an http(s) URL an admin
    // entered. Anything else (javascript:, data: …) is refused so it can't end up in an <img src>.
    image: {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: (v) => !v || /^\/uploads\/[\w.-]+$/.test(v) || /^https?:\/\/\S+$/i.test(v),
        message: 'Hospital image must be an uploaded file or an http(s) URL.',
      },
    },
  },
  { timestamps: true }
);

hospitalSchema.index({ name: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
