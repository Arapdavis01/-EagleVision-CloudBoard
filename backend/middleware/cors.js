const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'https://eaglevision-cloudboard.onrender.com'  // your frontend URL
];

module.exports = cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
});
