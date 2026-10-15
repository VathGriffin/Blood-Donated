const mongoose = require('mongoose');

// Admin-editable content of the public About page. A single document (key "about") holds it.
const aboutSettingsSchema = new mongoose.Schema({
  key:          { type: String, required: true, unique: true, default: 'about' },
  creatorPhoto: { type: String, default: null }, // "/uploads/about-creator-…" for the "Builders Behind It" card
}, { timestamps: true });

module.exports = mongoose.model('AboutSettings', aboutSettingsSchema);
