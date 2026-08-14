const pool = require('../config/db');

const loginSessionService = {
  /**
   * Create a new pending login session.
   * @param {string} sessionToken - unique UUID token
   * @param {Date} expiresAt - expiry timestamp
   * @returns {Promise<Object>} inserted session row
   */
  async createSession(sessionToken, expiresAt) {
    const { rows } = await pool.query(
      `INSERT INTO login_sessions (session_token, status, expires_at)
       VALUES ($1, 'pending', $2)
       RETURNING *`,
      [sessionToken, expiresAt]
    );
    return rows[0];
  },

  /**
   * Get a session by token.
   * @param {string} sessionToken
   * @returns {Promise<Object|null>} session row or null if not found
   */
  async getSessionByToken(sessionToken) {
    const { rows } = await pool.query(
      `SELECT * FROM login_sessions WHERE session_token = $1`,
      [sessionToken]
    );
    return rows.length ? rows[0] : null;
  },

  /**
   * Mark a session as approved and associate it with an admin.
   * @param {string} sessionToken
   * @param {number} adminId
   */
  async approveSession(sessionToken, adminId) {
    await pool.query(
      `UPDATE login_sessions
       SET status = 'approved', admin_id = $1
       WHERE session_token = $2`,
      [adminId, sessionToken]
    );
  },

  /**
   * Mark a session as used.
   * @param {string} sessionToken
   */
  async markSessionUsed(sessionToken) {
    await pool.query(
      `UPDATE login_sessions SET status = 'used' WHERE session_token = $1`,
      [sessionToken]
    );
  },

  /**
   * Mark a session as expired.
   * @param {string} sessionToken
   */
  async markSessionExpired(sessionToken) {
    await pool.query(
      `UPDATE login_sessions SET status = 'expired' WHERE session_token = $1`,
      [sessionToken]
    );
  },

  /**
   * Clean up expired sessions (optional maintenance).
   */
  async deleteExpiredSessions() {
    await pool.query(
      `DELETE FROM login_sessions WHERE expires_at < NOW() AND status IN ('pending', 'expired')`
    );
  },
};

module.exports = loginSessionService;
