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
  },
  { timestamps: true }
);

hospitalSchema.index({ name: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
