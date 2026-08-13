import { showModal } from '../components/modal.js';

/**
 * Show a modern confirmation dialog.
 * @param {string} message
 * @param {string} title
 * @returns {Promise<boolean>} resolves true if confirmed
 */
export function confirmDialog(message, title = 'Are you sure?') {
  return new Promise((resolve) => {
    const content = `
      <div class="confirm-dialog">
        <div class="confirm-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn btn-outline confirm-cancel-btn">Cancel</button>
          <button class="btn btn-danger confirm-ok-btn">Delete</button>
        </div>
      </div>
    `;

    const { close, element } = showModal(content);

    const handleCancel = () => {
      close();
      resolve(false);
    };

    const handleOk = () => {
      close();
      resolve(true);
    };

    element.querySelector('.confirm-cancel-btn').addEventListener('click', handleCancel);
    element.querySelector('.confirm-ok-btn').addEventListener('click', handleOk);

    // Close on overlay click = cancel
    element.addEventListener('click', (e) => {
      if (e.target === element) handleCancel();
    });
  });
}

function escapeHtml(text) {
  return text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
