const Storage = {
  PROJECTS_KEY: 'tagforge_projects',
  LAST_PROJECT_KEY: 'tagforge_last_project',

  getDefaultState() {
    return {
      text: 'YÖNETİCİ',
      font: 'Minecraft',
      fontSize: 8,
      textColor: '#FFFFFF',
      textOutline: true,
      outlineColor: '#000000',
      outlineSize: 1,
      bgType: 'transparent',
      bgColor: '#000000',
      bgOpacity: 100,
      paddingL: 3,
      paddingR: 3,
      paddingT: 1,
      paddingB: 1,
      bold: false,
      italic: false,
      underline: false,
      shadow: false,
      shadowColor: '#000000',
      shadowBlur: 2,
      glow: false,
      glowColor: '#9B5CFF',
      glowStrength: 3,
      glowOpacity: 50,
      gradient: false,
      gradientColor1: '#FFFFFF',
      gradientColor2: '#9B5CFF',
      gradientDir: 'horizontal',
      pixelPerfect: true,
      canvasW: 122,
      canvasH: 15,
      borderEnabled: false,
      borderColor: '#000000',
      borderWidth: 1,
      borderRadius: 0,
      shape: 'none',
      iconEnabled: false,
      iconData: null,
      iconSize: 10,
      iconPosition: 'left',
      iconSpacing: 2
    };
  },

  saveLastProject(state) {
    try {
      localStorage.setItem(this.LAST_PROJECT_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save last project:', e);
    }
  },

  loadLastProject() {
    try {
      const data = localStorage.getItem(this.LAST_PROJECT_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not load last project:', e);
    }
    return null;
  },

  getProjects() {
    try {
      const data = localStorage.getItem(this.PROJECTS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not load projects:', e);
    }
    return [];
  },

  saveProject(name, state) {
    const projects = this.getProjects();
    const existing = projects.findIndex(p => p.name === name);
    const project = {
      name,
      state: { ...state },
      savedAt: new Date().toISOString()
    };
    if (existing >= 0) {
      projects[existing] = project;
    } else {
      projects.push(project);
    }
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
      return true;
    } catch (e) {
      console.warn('Could not save project:', e);
      return false;
    }
  },

  deleteProject(name) {
    const projects = this.getProjects().filter(p => p.name !== name);
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
      return true;
    } catch (e) {
      return false;
    }
  },

  loadProject(name) {
    const project = this.getProjects().find(p => p.name === name);
    return project ? project.state : null;
  },

  exportProjectJSON(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tag-project.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importProjectJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const state = JSON.parse(e.target.result);
          resolve(state);
        } catch (err) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};

if (typeof module !== 'undefined') module.exports = Storage;
