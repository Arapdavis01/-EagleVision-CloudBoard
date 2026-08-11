import { authService } from '../../services/authService.js';

export async function loginPage() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  const loginHTML = `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-header">
          <i class="fas fa-user-circle fa-3x"></i>
          <h1>Welcome Back!</h1>
          <p class="login-subtitle">Please sign in to continue</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="Enter email" required autofocus>
          </div>
          <div class="form-group password-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter password" required>
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

        <div class="login-links">
          <a href="#" class="forgot-link">Forgot Password?</a>
        </div>

        <hr>

        <div class="login-footer">
          <p>&copy; 2026 <a href="https://advance-portfolio-nu.vercel.app/" target="_blank">Dancun.K.Koech</a></p>
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
}
