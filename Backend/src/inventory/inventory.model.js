const mongoose = require('mongoose');
const { BLOOD_TYPES } = require('../common/blood-types');

const inventorySchema = new mongoose.Schema({
  bloodType: {
    type: String,
    enum: BLOOD_TYPES,
    required: true,
  },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  units:       { type: Number, default: 0, min: 0 },
  minUnits:    { type: Number, default: 10 },
  maxUnits:    { type: Number, default: 200 },
  expiryDate:  { type: Date, default: null },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy:   { type: String, default: 'system' },
}, { timestamps: true });

// hospital: null = the central/unassigned pool; each hospital gets its own row per blood type.
inventorySchema.index({ hospital: 1, bloodType: 1 }, { unique: true });

inventorySchema.virtual('status').get(function () {
  if (this.units === 0)             return 'empty';
  if (this.units < this.minUnits)   return 'critical';
  if (this.units < this.minUnits * 2) return 'low';
  return 'adequate';
});

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('BloodInventory', inventorySchema);
