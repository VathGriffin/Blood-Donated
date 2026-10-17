// Rules for a staff member's new password, shared by every route that sets one.
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything past 72 bytes

// Returns why `password` can't be used, or null when it can.
function newPasswordError(password) {
  if (password.length < PASSWORD_MIN) return `New password must be at least ${PASSWORD_MIN} characters.`;
  if (Buffer.byteLength(password) > PASSWORD_MAX_BYTES) return `New password must be at most ${PASSWORD_MAX_BYTES} characters.`;
  return null;
}

module.exports = { PASSWORD_MIN, newPasswordError };
