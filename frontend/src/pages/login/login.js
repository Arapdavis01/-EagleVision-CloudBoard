import { authService } from '../../services/authService.js';
import { showModal } from '../../components/modal.js';

export async function loginPage() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Determine if the current device is mobile (hide QR login on mobile)
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

  // Build the login form HTML
  const loginHTML = `
    <div class="login-wrapper modern-login">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <i class="fas fa-eye"></i>
          </div>
          <h1>EagleVision</h1>
          <p class="login-subtitle">Sign in to your dashboard</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label for="email"><i class="fas fa-envelope"></i> Email</label>
            <input type="email" id="email" placeholder="Enter your email" required autofocus>
          </div>
          <div class="form-group password-group">
            <label for="password"><i class="fas fa-lock"></i> Password</label>
            <input type="password" id="password" placeholder="Enter your password" required>
            <button type="button" id="toggle-password" class="toggle-password" aria-label="Show password">
              <i class="fas fa-eye" id="eye-icon"></i>
            </button>
          </div>
          <div class="form-group form-check">
            <input type="checkbox" id="rememberMe" class="form-check-input">
            <label for="rememberMe" class="form-check-label">Remember me</label>
          </div>
          <p id="error" class="error-message" role="alert"></p>
          <button type="submit" class="btn btn-primary btn-block">
            <span id="login-spinner" class="spinner hidden"></span>
            <span id="login-text">Sign In</span>
          </button>
        </form>

        ${!isMobile ? `
        <div class="login-divider">
          <span>or</span>
        </div>

        <button id="qr-login-btn" class="btn btn-outline btn-block">
          <i class="fas fa-qrcode"></i> Login with QR Code
        </button>
        ` : ''}

        <div class="login-footer">
          <p>&copy; 2026 EagleVision CloudBoard</p>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = loginHTML;

  // Password visibility toggle
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');
  const eyeIcon = document.getElementById('eye-icon');

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    eyeIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
  });

  // Login form submission
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('error');
  const loginSpinner = document.getElementById('login-spinner');
  const loginText = document.getElementById('login-text');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      errorEl.textContent = 'Please fill in both fields.';
      return;
    }

    errorEl.textContent = '';
    loginSpinner.classList.remove('hidden');
    loginText.textContent = 'Signing in...';

    try {
      await authService.login(email, password);
      location.hash = '#dashboard';
    } catch (err) {
      errorEl.textContent = err.message || 'Login failed. Check your credentials.';
      loginSpinner.classList.add('hidden');
      loginText.textContent = 'Sign In';
    }
  });

  // QR Login (only on desktop)
  if (!isMobile) {
    document.getElementById('qr-login-btn').addEventListener('click', startQrLogin);
  }

  let qrModal = null;
  let pollInterval = null;

  async function startQrLogin() {
    try {
      const session = await authService.generateLoginSession();
      const sessionToken = session.session_token;
      const qrData = `${window.location.origin}/#approve-login?session=${encodeURIComponent(sessionToken)}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;

      const modalContent = `
        <div class="qr-login-modal">
          <h3><i class="fas fa-qrcode"></i> Scan QR Code</h3>
          <p>Open your phone camera and scan the code to log in automatically.</p>
          <div class="qr-code-wrapper">
            <img src="${qrImageUrl}" alt="QR Code Login" />
          </div>
          <p class="qr-timer" id="qr-timer">Expires in 02:00</p>
          <button id="cancel-qr-btn" class="btn btn-outline btn-sm">Cancel</button>
        </div>
      `;

      qrModal = showModal(modalContent);

      document.getElementById('cancel-qr-btn').addEventListener('click', () => {
        cleanupQrLogin();
      });

      let secondsLeft = 120;
      const timerEl = document.getElementById('qr-timer');
      const timerInterval = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          clearInterval(timerInterval);
          timerEl.textContent = 'Expired';
          cleanupQrLogin();
          errorEl.textContent = 'QR code expired. Please try again.';
          return;
        }
        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;
        timerEl.textContent = `Expires in ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }, 1000);

      pollInterval = setInterval(async () => {
        try {
          const statusData = await authService.checkLoginSessionStatus(sessionToken);
          if (statusData.status === 'approved') {
            clearInterval(pollInterval);
            clearInterval(timerInterval);
            if (statusData.token) {
              localStorage.setItem('token', statusData.token);
              qrModal.close();
              location.hash = '#dashboard';
            }
          } else if (statusData.status === 'expired') {
            clearInterval(pollInterval);
            clearInterval(timerInterval);
            qrModal.close();
            errorEl.textContent = 'QR code expired. Please try again.';
          }
        } catch (err) {
          console.error('QR status check failed', err);
        }
      }, 2000);
    } catch (err) {
      console.error('QR login error', err);
      errorEl.textContent = err.message || 'Failed to start QR login.';
    }
  }

  function cleanupQrLogin() {
    if (pollInterval) clearInterval(pollInterval);
    if (qrModal) qrModal.close();
    qrModal = null;
    pollInterval = null;
  }
}
