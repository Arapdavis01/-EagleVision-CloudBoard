module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret',
  jwtExpiresIn: '2h'
};
