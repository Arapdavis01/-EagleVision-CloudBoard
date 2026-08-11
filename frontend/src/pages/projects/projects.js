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
        <button id="add-project-btn" class="btn"><i class="fas fa-plus"></i> Add Project</button>
        <div class="view-toggle">
          <button class="btn view-grid active" data-view="grid"><i class="fas fa-th-large"></i> Grid</button>
          <button class="btn view-list" data-view="list"><i class="fas fa-list"></i> List</button>
        </div>
      </div>
      <div id="projects-container" class="projects-grid"></div>
    </div>
  `;

  initSidebar();

  // --- State ---
  let currentView = 'grid';
  let projects = [];
  let activeFilter = '';

  // --- Read filter from URL hash ---
  const hash = location.hash.split('?')[1] || '';
  const params = new URLSearchParams(hash);
  activeFilter = params.get('filter') || '';   // 'all', 'live', 'clients', 'revenue'

  const searchInput = document.getElementById('search');
  const addBtn = document.getElementById('add-project-btn');
  const container = document.getElementById('projects-container');
  const viewGridBtn = document.querySelector('.view-grid');
  const viewListBtn = document.querySelector('.view-list');

  // --- Load projects (with optional search and filter) ---
  async function loadProjects(search = '') {
    projects = await projectService.getAll(search);

    // Apply client‑side filter based on URL parameter
    if (activeFilter === 'live') {
      projects = projects.filter(p => p.status === 'Live');
    } else if (activeFilter === 'revenue') {
      // Redirect to finance – no need to show projects
      location.hash = '#finance';
      return;
    } else if (activeFilter === 'clients') {
      // Could show a modal with distinct clients; for now just show all
      // (you can add a clients modal later)
    }
    // 'all' or empty shows everything

    renderProjects();
  }

  // --- Render project cards ---
  function renderProjects() {
    container.className = currentView === 'grid' ? 'projects-grid' : 'projects-list';
    container.innerHTML = projects.map(p => renderProjectCard(p, currentView)).join('');
  }

  // --- Event delegation for project card actions ---
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

  // --- Edit project handler (with Back button support) ---
  async function handleEdit(projectId) {
    const project = projects.find(p => p.id == projectId);
    if (!project) return showToast('Project not found', 'error');

    const { close } = showModal(renderProjectForm(project));
    const form = document.getElementById('project-form');
    if (!form) return;

    // ✅ Back button closes the modal
    const cancelBtn = document.querySelector('.cancel-form-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => close());
    }

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

  // --- Delete project handler ---
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

  // --- Copy public link handler ---
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

  // --- Add Project button (with Back button support) ---
  addBtn.addEventListener('click', () => {
    const { close } = showModal(renderProjectForm());
    const form = document.getElementById('project-form');
    if (!form) return;

    // ✅ Back button closes the modal
    const cancelBtn = document.querySelector('.cancel-form-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => close());
    }

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

  // --- Search input ---
  searchInput.addEventListener('input', (e) => loadProjects(e.target.value));

  // --- View toggle (Grid/List) ---
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

  // --- Initial load ---
  loadProjects();
}
