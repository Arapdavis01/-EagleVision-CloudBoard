import { authService } from '../../services/authService.js';
import { showToast } from '../../utils/notifications.js';

export async function approveLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Extract session token from URL hash query
  const hashParams = new URLSearchParams(location.hash.split('?')[1] || '');
  const sessionToken = hashParams.get('session') || '';

  if (!sessionToken) {
    app.innerHTML = `
      <div class="approve-login-wrapper">
        <div class="approve-login-card">
          <div class="approve-login-header">
            <i class="fas fa-exclamation-circle"></i>
            <h1>Invalid Link</h1>
            <p>No session token provided. Please scan the QR code again.</p>
          </div>
          <a href="#login" class="btn btn-primary btn-block">Go to Login</a>
        </div>
      </div>
    `;
    return;
  }

  // Show approval UI with PIN input (no login required)
  app.innerHTML = `
    <div class="approve-login-wrapper">
      <div class="approve-login-card">
        <div class="approve-login-header">
          <i class="fas fa-shield-alt"></i>
          <h1>Approve Login?</h1>
          <p>A new browser is trying to sign in using QR code. Enter your secret PIN to approve.</p>
        </div>
        <div class="pin-input-container">
          <input 
            type="password" 
            id="approve-pin-input" 
            class="pin-input" 
            maxlength="6" 
            inputmode="numeric" 
            pattern="[0-9]*" 
            placeholder="••••••" 
            autocomplete="one-time-code"
            required
          />
        </div>
        <div class="approve-actions">
          <button id="approve-login-btn" class="btn btn-primary btn-block">Approve</button>
          <button id="deny-login-btn" class="btn btn-outline btn-block">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('approve-login-btn').addEventListener('click', async () => {
    const pinInput = document.getElementById('approve-pin-input');
    const pin = pinInput.value.trim();

    // Basic validation: exactly 6 digits
    if (!/^\d{6}$/.test(pin)) {
      showToast('Please enter a valid 6‑digit PIN', 'error');
      pinInput.focus();
      return;
    }

    try {
      await authService.approveLoginSession(sessionToken, pin);
      showToast('Login approved successfully', 'success');
      document.getElementById('approve-login-btn').disabled = true;
      document.getElementById('approve-login-btn').innerHTML = '<i class="fas fa-check"></i> Approved';
      setTimeout(() => {
        // Try to close the tab; fallback to login page
        window.close();
        // If window.close() is blocked, redirect after a short delay
        setTimeout(() => {
          location.hash = '#login';
        }, 500);
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
      pinInput.value = '';
      pinInput.focus();
    }
  });

  document.getElementById('deny-login-btn').addEventListener('click', () => {
    showToast('Login denied', 'info');
    setTimeout(() => window.close(), 1000);
    // Fallback in case window.close() is blocked
    setTimeout(() => {
      location.hash = '#login';
    }, 1500);
  });
}
