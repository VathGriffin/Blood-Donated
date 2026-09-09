// Whole-blood donation eligibility interval, in days. Single source of truth —
// donor.routes.js and chat.tools.js both need this and previously duplicated it.
const ELIGIBILITY_INTERVAL_DAYS = 56;

function computeEligibility(lastDonation) {
  if (!lastDonation) return { eligible: true, daysSinceLastDonation: null, nextEligibleDate: null };
  const days = Math.floor((Date.now() - new Date(lastDonation).getTime()) / 86400000);
  const eligible = days >= ELIGIBILITY_INTERVAL_DAYS;
  return {
    eligible,
    daysSinceLastDonation: days,
    nextEligibleDate: eligible
      ? null
      : new Date(new Date(lastDonation).getTime() + ELIGIBILITY_INTERVAL_DAYS * 86400000).toISOString(),
  };
}

module.exports = { ELIGIBILITY_INTERVAL_DAYS, computeEligibility };
