// The one definition of the empty/critical/low/adequate thresholds — used by the inventory
// model's `status` virtual and by aggregated rows that aren't documents.
const stockStatus = (units, minUnits) => {
  if (units === 0)          return 'empty';
  if (units < minUnits)     return 'critical';
  if (units < minUnits * 2) return 'low';
  return 'adequate';
};

module.exports = { stockStatus };
