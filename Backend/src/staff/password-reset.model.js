const mongoose = require('mongoose');

// One outstanding password-reset link per staff member. Only a SHA-256 hash of the token is
// stored, so a database leak can't be turned into working links. Documents are deleted when
// used, when a newer link is requested, and by MongoDB's TTL monitor once expired.
const passwordResetSchema = new mongoose.Schema({
  staff:     { type: mongoose.Schema.Types.ObjectId, ref: 'StaffUser', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
