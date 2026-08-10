import { projectService } from '../../services/projectService.js';
import { renderProjectCard } from '../../components/projectCard.js';
import { showModal } from '../../components/modal.js';
import { renderProjectForm } from '../../components/projectForm.js';
import { showToast } from '../../utils/notifications.js';

export async function projectsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="sidebar">...</div> <!-- reuse sidebar from dashboard pattern -->
    <div class="main-content">
      <h2>Projects</h2>
      <div class="toolbar">
        <input type="text" id="search" placeholder="Search...">
        <button id="add-project-btn" class="btn">Add Project</button>
        <div class="view-toggle">
          <button class="btn view-grid">Grid</button>
          <button class="btn view-list">List</button>
        </div>
      </div>
      <div id="projects-container"></div>
    </div>
  `;

  // Sidebar code (same as dashboard) – better to extract to a component, but for brevity repeat it
  // ... (implement sidebar links as in dashboard)

  let currentView = 'grid';
  let projects = [];

  async function loadProjects(search = '') {
    projects = await projectService.getAll(search);
    renderProjects();
  }

  function renderProjects() {
    const container = document.getElementById('projects-container');
    container.className = currentView === 'grid' ? 'projects-grid' : 'projects-list';
    container.innerHTML = projects.map(p => renderProjectCard(p, currentView)).join('');
    attachProjectEvents();
  }

  function attachProjectEvents() {
    document.querySelectorAll('.edit-project').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const project = projects.find(p => p.id == id);
        const { close } = showModal(renderProjectForm(project));
        document.getElementById('project-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const data = Object.fromEntries(formData.entries());
          try {
            await projectService.update(id, data);
            close();
            loadProjects();
            showToast('Project updated', 'success');
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      };
    });

    document.querySelectorAll('.delete-project').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (confirm('Delete this project?')) {
          await projectService.delete(id);
          loadProjects();
          showToast('Project deleted', 'info');
        }
      };
    });
  }

  document.getElementById('add-project-btn').onclick = () => {
    const { close } = showModal(renderProjectForm());
    document.getElementById('project-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      try {
        await projectService.create(data);
        close();
        loadProjects();
        showToast('Project created', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  document.getElementById('search').addEventListener('input', (e) => loadProjects(e.target.value));
  document.querySelector('.view-grid').addEventListener('click', () => {
    currentView = 'grid';
    renderProjects();
  });
  document.querySelector('.view-list').addEventListener('click', () => {
    currentView = 'list';
    renderProjects();
  });

  loadProjects();
}
