const mongoose = require('mongoose');

// Admin-editable content of the public About page. A single document (key "about") holds it.
const aboutSettingsSchema = new mongoose.Schema({
  key:          { type: String, required: true, unique: true, default: 'about' },
  creatorPhoto: { type: String, default: null }, // "/uploads/about-creator-…" for the "Builders Behind It" card
  heroImage:    { type: String, default: null }, // "/uploads/about-hero-…" — the hero photo
  purposeImage: { type: String, default: null }, // "/uploads/about-purpose-…" — the "Our Purpose" photo
  // Page text, already checked against about.sections.js. Missing fields show the built-in text.
  sections:     { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('AboutSettings', aboutSettingsSchema);
