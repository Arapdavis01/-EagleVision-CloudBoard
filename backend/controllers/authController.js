const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    // optional audit log
    await pool.query('INSERT INTO admin_audit_logs (admin_id, action, details) VALUES ($1, $2, $3)',
      [admin.id, 'LOGIN', `Login at ${new Date().toISOString()}`]
    );

    res.json({ message: 'Login successful', email: admin.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

exports.checkSession = (req, res) => {
  // already passed authMiddleware
  res.json({ authenticated: true, email: req.adminEmail });
};
