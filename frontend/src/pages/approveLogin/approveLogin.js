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

  // Check if user is logged in on this device (phone)
  let isAuthenticated = false;
  try {
    const session = await authService.checkSession();
    isAuthenticated = session && session.authenticated;
  } catch (err) {
    // Not logged in
    isAuthenticated = false;
  }

  if (!isAuthenticated) {
    app.innerHTML = `
      <div class="approve-login-wrapper">
        <div class="approve-login-card">
          <div class="approve-login-header">
            <i class="fas fa-user-lock"></i>
            <h1>Login Required</h1>
            <p>Please log in on your phone first, then scan the QR code again.</p>
          </div>
          <a href="#login" class="btn btn-primary btn-block">Go to Login</a>
        </div>
      </div>
    `;
    return;
  }

  // Show approval UI
  app.innerHTML = `
    <div class="approve-login-wrapper">
      <div class="approve-login-card">
        <div class="approve-login-header">
          <i class="fas fa-shield-alt"></i>
          <h1>Approve Login?</h1>
          <p>A new browser is trying to sign in using QR code. If this was you, approve the login.</p>
        </div>
        <div class="device-info">
          <p><strong>Device:</strong> ${navigator.userAgent.includes('Mobile') ? 'Mobile Phone' : 'Desktop'}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="approve-actions">
          <button id="approve-login-btn" class="btn btn-primary btn-block">Approve</button>
          <button id="deny-login-btn" class="btn btn-outline btn-block">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('approve-login-btn').addEventListener('click', async () => {
    try {
      await authService.approveLoginSession(sessionToken);
      showToast('Login approved successfully', 'success');
      // Optionally show success state
      document.getElementById('approve-login-btn').disabled = true;
      document.getElementById('approve-login-btn').innerHTML = '<i class="fas fa-check"></i> Approved';
      setTimeout(() => {
        location.hash = '#dashboard';  // or close tab if possible
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    }
  });

  document.getElementById('deny-login-btn').addEventListener('click', () => {
    // Close the page or show message
    showToast('Login denied', 'info');
    setTimeout(() => window.close(), 1000);  // may not work in all browsers; fallback:
    // Or simply redirect to login page
    // location.hash = '#login';
  });
}
