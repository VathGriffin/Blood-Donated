const mongoose = require('mongoose');

const homepageProfileSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  role:      { type: String, required: true },
  initials:  { type: String, required: true },
  color:     { type: String, default: '#dc2626' },
  photo:     { type: String, default: null },
  bloodType: { type: String, default: '' },
  bio:       { type: String, default: '' },
  donations: { type: Number, default: 0 },
  badge:     { type: String, default: '' },
  order:     { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('HomepageProfile', homepageProfileSchema);
