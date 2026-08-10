import { authService } from '../../services/authService.js';
import { showToast } from '../../utils/notifications.js';

export async function loginPage() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const loginHTML = `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-icon">🦅</span>
          <h1>EagleVision</h1>
          <p class="tagline">CloudBoard</p>
        </div>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="admin@example.com" required autofocus>
          </div>
          <div class="form-group password-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="••••••••" required>
            <button type="button" id="toggle-password" class="toggle-password" aria-label="Show password">
              <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
          <p id="error" class="error-message" role="alert"></p>
          <button type="submit" class="btn btn-primary btn-block">
            <span id="login-spinner" class="spinner hidden"></span>
            <span id="login-text">Sign In</span>
          </button>
        </form>
      </div>
    </div>
  `;

  app.innerHTML = loginHTML;

  // --- Password visibility toggle ---
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');
  const eyeIcon = document.getElementById('eye-icon');

  function updateEyeIcon(isPassword) {
    eyeIcon.innerHTML = isPassword
      ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
      : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  }

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    updateEyeIcon(!isPassword);
  });

  // --- Login form submission ---
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('error');
  const loginSpinner = document.getElementById('login-spinner');
  const loginText = document.getElementById('login-text');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Basic validation
    if (!email || !password) {
      errorEl.textContent = 'Please fill in both fields.';
      return;
    }

    // Show loading state
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
}
