const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
    unique: true,
  },
  units:       { type: Number, default: 0, min: 0 },
  minUnits:    { type: Number, default: 10 },
  maxUnits:    { type: Number, default: 200 },
  expiryDate:  { type: Date, default: null },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy:   { type: String, default: 'system' },
}, { timestamps: true });

inventorySchema.virtual('status').get(function () {
  if (this.units === 0)             return 'empty';
  if (this.units < this.minUnits)   return 'critical';
  if (this.units < this.minUnits * 2) return 'low';
  return 'adequate';
});

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('BloodInventory', inventorySchema);
