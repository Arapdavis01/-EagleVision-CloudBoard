import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { projectService } from '../../services/projectService.js';
import { renderShowcaseCard } from '../../components/showcaseCard.js';
import { showModal } from '../../components/modal.js';
import { showToast } from '../../utils/notifications.js';

export async function showcasePage() {
  document.body.classList.add('app-dashboard');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <div class="showcase-header">
        <h2>Project Showcase</h2>
        <button id="refresh-showcase-btn" class="btn btn-outline"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>
      <div id="showcase-grid" class="showcase-grid">
        <p class="empty-state">Loading projects…</p>
      </div>
    </div>
  `;

  initSidebar();

  const escapeHtml = (text) =>
    text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

  async function loadShowcase() {
    const grid = document.getElementById('showcase-grid');
    try {
      const projects = await projectService.getAll();
      if (projects.length === 0) {
        grid.innerHTML = `<p class="empty-state"><i class="fas fa-folder-open fa-3x"></i><br>No projects found.</p>`;
        return;
      }
      grid.innerHTML = projects.map(p => renderShowcaseCard(p)).join('');
    } catch (err) {
      console.error('Failed to load showcase:', err);
      showToast('Failed to load projects.', 'error');
      grid.innerHTML = `<p class="empty-state">Error loading projects.</p>`;
    }
  }

  document.getElementById('refresh-showcase-btn').addEventListener('click', loadShowcase);

  // Card click → open detail modal
  document.getElementById('showcase-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.showcase-card');
    if (!card) return;
    const projectId = card.dataset.id;
    openProjectDetails(projectId);
  });

  async function openProjectDetails(projectId) {
    try {
      const project = await projectService.getOne(projectId);
      const techStack = project.tech_stack
        ? (Array.isArray(project.tech_stack) ? project.tech_stack : JSON.parse(project.tech_stack)).join(', ')
        : '—';
      const content = `
        <div class="modal-header-bar">
          <h2><i class="fas fa-info-circle"></i> ${escapeHtml(project.name)}</h2>
          <span class="status ${(project.status || '').toLowerCase()}">${escapeHtml(project.status) || '—'}</span>
        </div>
        ${project.thumbnail_url
          ? `<img src="${escapeHtml(project.thumbnail_url)}" alt="${escapeHtml(project.name)}" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin-bottom:1rem;" />`
          : `<div class="showcase-placeholder" style="height:200px;margin-bottom:1rem;"><i class="fas fa-image"></i></div>`
        }
        <div class="quick-view-grid">
          <div><strong>Client:</strong> ${escapeHtml(project.client) || '—'}</div>
          <div><strong>Location:</strong> ${escapeHtml(project.location) || '—'}</div>
          <div><strong>Live URL:</strong> <a href="${escapeHtml(project.live_url)}" target="_blank">${escapeHtml(project.live_url) || '—'}</a></div>
          <div><strong>GitHub:</strong> <a href="${escapeHtml(project.github)}" target="_blank">${escapeHtml(project.github) || '—'}</a></div>
          <div><strong>Hosting:</strong> ${escapeHtml(project.hosting) || '—'}</div>
          <div><strong>Tech Stack:</strong> ${techStack}</div>
          <div><strong>Project Type:</strong> ${escapeHtml(project.project_type) || '—'}</div>
          <div><strong>Last Updated:</strong> ${project.last_updated ? new Date(project.last_updated).toLocaleString() : '—'}</div>
        </div>
        <div class="form-group">
          <strong>Description:</strong>
          <p>${escapeHtml(project.description) || 'No description.'}</p>
        </div>
        <div class="form-actions">
          <button id="close-showcase-modal-btn" class="btn btn-outline"><i class="fas fa-arrow-left"></i> Back</button>
        </div>
      `;
      const { close } = showModal(content);
      document.getElementById('close-showcase-modal-btn')?.addEventListener('click', close);
    } catch (err) {
      showToast('Failed to load project details.', 'error');
    }
  }

  // Initial load
  loadShowcase();
}
