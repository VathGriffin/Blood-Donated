const mongoose = require('mongoose');

const connect = (uri = process.env.MONGO_URI || 'mongodb://localhost:27017/blood-donation') => {
  mongoose.set('bufferCommands', false);
  return mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
      console.error('⚠️  MongoDB connection failed:', err.message);
      console.error('   Fix: check your Atlas cluster at https://cloud.mongodb.com');
      console.error('   Make sure the cluster is running and your IP is whitelisted.');
    });
};

// Settings the API cannot run correctly without in production. Locally the database falls back
// to mongodb://localhost, but on a host a missing value would only show up later — as logins
// failing with a 500 or the API quietly using a database that isn't there — so server.js stops
// at startup instead and names what is missing.
const REQUIRED_IN_PRODUCTION = ['MONGO_URI', 'JWT_SECRET', 'QR_JWT_SECRET'];
// Missing these is allowed but almost always a mistake on a host, so it is logged.
const RECOMMENDED_IN_PRODUCTION = {
  FRONTEND_URL: 'browsers on your deployed frontend will be blocked by CORS',
  GEMINI_API_KEY: 'the AI assistant will answer from its offline guide only',
  SMTP_HOST: 'hospital staff cannot reset a forgotten password by email (also set SMTP_USER, SMTP_PASS, MAIL_FROM, APP_URL)',
};

const isSet = (env, name) => typeof env[name] === 'string' && env[name].trim() !== '';

function checkEnv(env = process.env) {
  if (env.NODE_ENV !== 'production') return { missing: [], warnings: [] };
  return {
    missing: REQUIRED_IN_PRODUCTION.filter((name) => !isSet(env, name)),
    warnings: Object.entries(RECOMMENDED_IN_PRODUCTION)
      .filter(([name]) => !isSet(env, name))
      .map(([name, effect]) => `${name} is not set — ${effect}.`),
  };
}

module.exports = { connect, checkEnv };
