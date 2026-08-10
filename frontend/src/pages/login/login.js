import { authService } from '../../services/authService.js';

export async function loginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-container">
      <h1>EagleVision CloudBoard</h1>
      <form id="login-form">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit" class="btn">Login</button>
        <p id="error" style="color:red"></p>
      </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await authService.login(email, password);
      location.hash = '#dashboard';
    } catch (err) {
      document.getElementById('error').textContent = err.message;
    }
  });
}
