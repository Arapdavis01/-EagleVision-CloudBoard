export function showModal(contentHtml) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-content">${contentHtml}</div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');

  const close = () => {
    overlay.remove();
    document.body.classList.remove('modal-open');
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Return a close function so modal can be closed programmatically
  return { close, element: overlay };
}
