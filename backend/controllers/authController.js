const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');
const loginSessionService = require('../services/loginSessionService');

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
      maxAge: 2 * 60 * 60 * 1000
    });

    await pool.query(
      'INSERT INTO admin_audit_logs (admin_id, action, details) VALUES ($1, $2, $3)',
      [admin.id, 'LOGIN', `Login at ${new Date().toISOString()}`]
    );

    res.json({ message: 'Login successful', email: admin.email, token });
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
  res.json({ authenticated: true, email: req.adminEmail });
};

// ==================== QR CODE LOGIN ====================

/**
 * POST /api/auth/qr/session
 * Creates a temporary login session for QR scanning.
 */
exports.generateLoginSession = async (req, res) => {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  try {
    const session = await loginSessionService.createSession(sessionToken, expiresAt);
    res.status(201).json({
      session_token: session.session_token,
      expires_at: session.expires_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create login session' });
  }
};

/**
 * GET /api/auth/qr/session/:token/status
 * Polled by laptop to check if session has been approved.
 */
exports.checkLoginSessionStatus = async (req, res) => {
  const { token } = req.params;

  try {
    const session = await loginSessionService.getSessionByToken(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      await loginSessionService.markSessionExpired(token);
      return res.json({ status: 'expired' });
    }

    if (session.status === 'pending') {
      return res.json({ status: 'pending' });
    }

    if (session.status === 'approved' && session.admin_id) {
      const { rows: adminRows } = await pool.query(
        `SELECT id, email FROM admins WHERE id = $1`,
        [session.admin_id]
      );
      if (adminRows.length === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const admin = adminRows[0];
      const jwtToken = jwt.sign(
        { adminId: admin.id, email: admin.email },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
      );

      // Mark session as used (single‑use)
      await loginSessionService.markSessionUsed(token);

      return res.json({
        status: 'approved',
        token: jwtToken,
        email: admin.email,
      });
    }

    // Already used or other state
    return res.json({ status: session.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /api/auth/qr/session/:token/approve
 * Called by the authenticated phone to approve a login session.
 */
exports.approveLoginSession = async (req, res) => {
  const { token } = req.params;
  const adminId = req.adminId;   // from auth middleware

  try {
    const session = await loginSessionService.getSessionByToken(token);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (new Date(session.expires_at) < new Date()) {
      await loginSessionService.markSessionExpired(token);
      return res.status(400).json({ error: 'Session expired' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ error: `Session already ${session.status}` });
    }

    await loginSessionService.approveSession(token, adminId);
    res.json({ message: 'Login approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
