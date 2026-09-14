const Toast = {
  show(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }
};

const App = {
  currentScale: 1,
  filename: 'tag',

  init() {
    CanvasRenderer.init('previewCanvas');
    Editor.init(state => this.onEditorChange(state));

    this.bindNavigation();
    this.bindExport();
    this.bindProjects();
    this.bindModal();

    const saved = Storage.loadLastProject();
    if (saved) {
      Editor.setState(saved);
    }

    this.render();
    this.updatePreviewInfo();
  },

  onEditorChange(state) {
    this.render();
    this.updatePreviewInfo();
  },

  render() {
    const state = Editor.getState();
    CanvasRenderer.render(state);
    this.updatePreviewInfo();
  },

  updatePreviewInfo() {
    const state = Editor.getState();
    const fit = CanvasRenderer.checkFit(state);
    const warningEl = document.getElementById('fitWarning');
    if (warningEl) {
      warningEl.classList.toggle('visible', !fit);
    }

    const dims = document.getElementById('previewDimensions');
    if (dims) dims.textContent = `${state.canvasW} × ${state.canvasH} px`;
  },

  bindNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = link.dataset.section;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById('section-' + target);
        if (section) section.classList.add('active');

        const navLinks = document.querySelector('.nav-links');
        if (navLinks) navLinks.classList.remove('open');
      });
    });

    const menuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
      menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
    }
  },

  bindExport() {
    const self = this;

    document.querySelectorAll('.export-scale-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.export-scale-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        self.currentScale = parseInt(this.dataset.scale);
      });
    });

    const filenameInput = document.getElementById('exportFilename');
    if (filenameInput) {
      filenameInput.addEventListener('input', function() {
        self.filename = this.value || 'tag';
      });
    }

    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.doExport());
    }
  },

  doExport() {
    const state = Editor.getState();
    const canvas = Exporter.exportAsPNG(state, this.currentScale);
    const scaleSuffix = this.currentScale > 1 ? `@${this.currentScale}x` : '';
    Exporter.downloadPNG(canvas, `${this.filename}${scaleSuffix}`);
    Toast.show(`PNG exported (${state.canvasW * this.currentScale}×${state.canvasH * this.currentScale})`, 'success');
  },

  bindProjects() {
    const self = this;

    const saveBtn = document.getElementById('saveProjectBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const name = prompt('Project name:', 'My Tag');
        if (name && name.trim()) {
          const state = Editor.getState();
          Storage.saveProject(name.trim(), state);
          this.refreshProjectsList();
          Toast.show('Project saved', 'success');
        }
      });
    }

    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => {
        const state = Editor.getState();
        Storage.exportProjectJSON(state);
        Toast.show('Project JSON exported', 'success');
      });
    }

    const importJsonBtn = document.getElementById('importJsonBtn');
    const importJsonInput = document.getElementById('importJsonInput');
    if (importJsonBtn && importJsonInput) {
      importJsonBtn.addEventListener('click', () => importJsonInput.click());
      importJsonInput.addEventListener('change', async function() {
        const file = this.files[0];
        if (file) {
          try {
            const state = await Storage.importProjectJSON(file);
            Editor.setState(state);
            self.render();
            Toast.show('Project imported', 'success');
          } catch (err) {
            Toast.show('Invalid project file', 'error');
          }
          this.value = '';
        }
      });
    }

    this.refreshProjectsList();
  },

  refreshProjectsList() {
    const container = document.getElementById('savedProjectsList');
    if (!container) return;
    const projects = Storage.getProjects();

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📂</div>
          <p>No saved projects yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    projects.forEach(project => {
      const item = document.createElement('div');
      item.className = 'project-item';
      const date = new Date(project.savedAt).toLocaleDateString();
      item.innerHTML = `
        <div>
          <div class="name">${project.name}</div>
          <div class="date">${date}</div>
        </div>
        <div class="actions">
          <button class="btn btn-sm btn-secondary load-project-btn" aria-label="Load project ${project.name}">Load</button>
          <button class="btn btn-sm btn-danger delete-project-btn" aria-label="Delete project ${project.name}">✕</button>
        </div>
      `;

      item.querySelector('.load-project-btn').addEventListener('click', () => {
        const state = Storage.loadProject(project.name);
        if (state) {
          Editor.setState(state);
          this.render();
          Toast.show(`Loaded: ${project.name}`, 'success');
        }
      });

      item.querySelector('.delete-project-btn').addEventListener('click', () => {
        if (confirm(`Delete "${project.name}"?`)) {
          Storage.deleteProject(project.name);
          this.refreshProjectsList();
          Toast.show('Project deleted', 'info');
        }
      });

      container.appendChild(item);
    });
  },

  bindModal() {
    const modal = document.getElementById('iaConfigModal');
    const closeBtn = document.getElementById('closeModal');
    const generateBtn = document.getElementById('generateIaConfig');
    const copyBtn = document.getElementById('copyConfigBtn');

    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        modal.classList.add('visible');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
    }

    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('visible');
      });
    }

    const iaGenerateBtn = document.getElementById('iaGenerateBtn');
    if (iaGenerateBtn) {
      iaGenerateBtn.addEventListener('click', () => {
        const namespace = document.getElementById('iaNamespace').value.trim() || 'mynamespace';
        const textureName = document.getElementById('iaTextureName').value.trim() || 'my_tag';
        const state = Editor.getState();
        const config = Exporter.generateItemsAdderConfig(state, namespace, textureName);
        document.getElementById('iaConfigOutput').textContent = config;
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = document.getElementById('iaConfigOutput').textContent;
        Exporter.copyToClipboard(code).then(() => {
          Toast.show('Config copied to clipboard', 'success');
        });
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
