// Whole-blood donation interval. Must match Backend/src/common/eligibility.js.
export const ELIGIBILITY_INTERVAL_DAYS = 56;
const DAY_MS = 86400000;

export const validDate = (date) => !!date && !Number.isNaN(new Date(date).getTime());

// Eligible again 56 days after the last donation; no (valid) last donation means eligible now.
export const eligibilityOf = (lastDonation) => {
  if (!validDate(lastDonation)) return { eligible: true, nextDate: null };
  const next = new Date(new Date(lastDonation).getTime() + ELIGIBILITY_INTERVAL_DAYS * DAY_MS);
  return next.getTime() <= Date.now() ? { eligible: true, nextDate: null } : { eligible: false, nextDate: next };
};
