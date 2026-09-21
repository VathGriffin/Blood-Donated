// Two failure modes made handlers crash with a 500 instead of answering 400 (found by fuzzing the API):
//
// 1. Express 5 leaves req.body undefined when the request is not JSON (text/plain, no Content-Type …),
//    and a JSON body can also be `null`, a string, a number or an array. Handlers that destructure
//    req.body then throw. normalizeBody guarantees a plain object.
//
// 2. Handlers call .trim() / .toLowerCase() / bcrypt on text fields, so {"email": {"$gt": ""}} or
//    {"password": 123} threw a TypeError. requireTextFields refuses such values up front. Only fields
//    that are text in every route that reads them are listed (`location` is deliberately absent:
//    it is text on donors but an object on hospitals).
const TEXT_FIELDS = [
  'email', 'password', 'currentPassword', 'newPassword',
  'fullName', 'name', 'phone', 'subject', 'message', 'content', 'token', 'accessToken',
];

const normalizeBody = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) req.body = {};
  next();
};

const requireTextFields = (req, res, next) => {
  for (const field of TEXT_FIELDS) {
    const value = req.body[field];
    if (value !== undefined && value !== null && typeof value !== 'string') {
      const text = `${field} must be text.`;
      return res.status(400).json({ message: text, error: text });
    }
  }
  next();
};

module.exports = { normalizeBody, requireTextFields, TEXT_FIELDS };
