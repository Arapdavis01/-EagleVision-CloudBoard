import { renderSidebar, initSidebar } from '../../components/sidebar.js';
import { projectService } from '../../services/projectService.js';
import { renderProjectCard } from '../../components/projectCard.js';
import { showModal } from '../../components/modal.js';
import { renderProjectForm } from '../../components/projectForm.js';
import { showToast } from '../../utils/notifications.js';

export async function projectsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      <h2>Projects</h2>
      <div class="toolbar">
        <input type="text" id="search" placeholder="Search...">
        <button id="add-project-btn" class="btn">Add Project</button>
        <div class="view-toggle">
          <button class="btn view-grid active" data-view="grid">Grid</button>
          <button class="btn view-list" data-view="list">List</button>
        </div>
      </div>
      <div id="projects-container" class="projects-grid"></div>
    </div>
  `;

  initSidebar();

  let currentView = 'grid';
  let projects = [];

  const searchInput = document.getElementById('search');
  const addBtn = document.getElementById('add-project-btn');
  const container = document.getElementById('projects-container');
  const viewGridBtn = document.querySelector('.view-grid');
  const viewListBtn = document.querySelector('.view-list');

  // Load projects from API
  async function loadProjects(search = '') {
    projects = await projectService.getAll(search);
    renderProjects();
  }

  // Render the project cards
  function renderProjects() {
    container.className = currentView === 'grid' ? 'projects-grid' : 'projects-list';
    container.innerHTML = projects.map(p => renderProjectCard(p, currentView)).join('');
  }

  // Event delegation for all project actions
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const projectId = btn.dataset.id;
    if (!projectId) return;

    if (btn.classList.contains('edit-project')) {
      handleEdit(projectId);
    } else if (btn.classList.contains('delete-project')) {
      handleDelete(projectId);
    } else if (btn.classList.contains('copy-link')) {
      handleCopyLink(btn.dataset.token);
    }
  });

  async function handleEdit(projectId) {
    const project = projects.find(p => p.id == projectId);
    if (!project) return showToast('Project not found', 'error');

    const { close } = showModal(renderProjectForm(project));
    const form = document.getElementById('project-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await projectService.update(projectId, data);
        close();
        await loadProjects();
        showToast('Project updated', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  async function handleDelete(projectId) {
    if (!confirm('Delete this project?')) return;
    try {
      await projectService.delete(projectId);
      await loadProjects();
      showToast('Project deleted', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleCopyLink(token) {
    if (!token) {
      showToast('No public link available', 'error');
      return;
    }
    const link = `${window.location.origin}/#public-status?token=${token}`;
    navigator.clipboard.writeText(link)
      .then(() => showToast('Public link copied!', 'success'))
      .catch(() => showToast('Failed to copy', 'error'));
  }

  // Add Project button
  addBtn.addEventListener('click', () => {
    const { close } = showModal(renderProjectForm());
    const form = document.getElementById('project-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      try {
        await projectService.create(data);
        close();
        await loadProjects();
        showToast('Project created', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Search input
  searchInput.addEventListener('input', (e) => loadProjects(e.target.value));

  // View toggle
  viewGridBtn.addEventListener('click', () => {
    currentView = 'grid';
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    renderProjects();
  });

  viewListBtn.addEventListener('click', () => {
    currentView = 'list';
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    renderProjects();
  });

  // Initial load
  loadProjects();
}
