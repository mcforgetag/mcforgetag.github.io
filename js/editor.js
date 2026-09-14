const Editor = {
  state: null,
  onChange: null,

  MC_COLORS: [
    { name: 'Black', code: '§0', hex: '#000000' },
    { name: 'Dark Blue', code: '§1', hex: '#0000AA' },
    { name: 'Dark Green', code: '§2', hex: '#00AA00' },
    { name: 'Dark Aqua', code: '§3', hex: '#00AAAA' },
    { name: 'Dark Red', code: '§4', hex: '#AA0000' },
    { name: 'Dark Purple', code: '§5', hex: '#AA00AA' },
    { name: 'Gold', code: '§6', hex: '#FFAA00' },
    { name: 'Gray', code: '§7', hex: '#AAAAAA' },
    { name: 'Dark Gray', code: '§8', hex: '#555555' },
    { name: 'Blue', code: '§9', hex: '#5555FF' },
    { name: 'Green', code: '§a', hex: '#55FF55' },
    { name: 'Aqua', code: '§b', hex: '#55FFFF' },
    { name: 'Red', code: '§c', hex: '#FF5555' },
    { name: 'Light Purple', code: '§d', hex: '#FF55FF' },
    { name: 'Yellow', code: '§e', hex: '#FFFF55' },
    { name: 'White', code: '§f', hex: '#FFFFFF' }
  ],

  FONTS: ['Minecraft', 'Pixel', 'Pixel Bold', 'Minecraft Bold', 'Arial', 'Verdana', 'Inter'],

  CANVAS_SIZES: [
    { w: 16, h: 16 }, { w: 32, h: 8 }, { w: 64, h: 16 },
    { w: 96, h: 16 }, { w: 122, h: 15 }, { w: 128, h: 16 },
    { w: 128, h: 32 }, { w: 256, h: 32 }, { w: 256, h: 64 },
    { w: 512, h: 64 }
  ],

  init(callback) {
    this.onChange = callback;
    this.state = Storage.getDefaultState();
    this.bindEvents();
    this.populateColorPalette();
    this.populateFonts();
    this.populateSizes();
    this.populatePresets();
    this.updateUI();
    this.render();
  },

  bindEvents() {
    const self = this;

    document.querySelectorAll('[data-prop]').forEach(el => {
      const prop = el.dataset.prop;
      const type = el.dataset.type || 'input';

      if (type === 'checkbox') {
        el.addEventListener('change', function() {
          self.state[prop] = this.checked;
          self.updateConditionalFields();
          self.save();
          self.render();
        });
      } else if (type === 'color') {
        el.addEventListener('input', function() {
          self.state[prop] = this.value;
          const hexInput = document.getElementById(prop + 'Hex');
          if (hexInput) hexInput.value = this.value;
          self.save();
          self.render();
        });
      } else if (type === 'select') {
        el.addEventListener('change', function() {
          self.state[prop] = this.value;
          self.save();
          self.render();
        });
      } else if (type === 'number') {
        el.addEventListener('input', function() {
          const val = parseInt(this.value);
          if (!isNaN(val) && val >= 0) {
            self.state[prop] = val;
            self.save();
            self.render();
          }
        });
      } else if (type === 'range') {
        el.addEventListener('input', function() {
          self.state[prop] = parseInt(this.value);
          const display = document.getElementById(prop + 'Display');
          if (display) display.textContent = this.value;
          self.save();
          self.render();
        });
      } else {
        el.addEventListener('input', function() {
          self.state[prop] = this.value;
          self.save();
          self.render();
        });
      }
    });

    document.querySelectorAll('[data-hex]').forEach(el => {
      const prop = el.dataset.hex;
      el.addEventListener('change', function() {
        if (/^#[0-9A-Fa-f]{6}$/.test(this.value)) {
          self.state[prop] = this.value;
          const colorInput = document.getElementById(prop);
          if (colorInput) colorInput.value = this.value;
          self.save();
          self.render();
        }
      });
    });

    const canvasW = document.getElementById('canvasW');
    const canvasH = document.getElementById('canvasH');
    if (canvasW) {
      canvasW.addEventListener('change', function() {
        self.state.canvasW = parseInt(this.value) || 122;
        self.save();
        self.render();
      });
    }
    if (canvasH) {
      canvasH.addEventListener('change', function() {
        self.state.canvasH = parseInt(this.value) || 15;
        self.save();
        self.render();
      });
    }

    document.querySelectorAll('.size-preset-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const w = parseInt(this.dataset.w);
        const h = parseInt(this.dataset.h);
        self.state.canvasW = w;
        self.state.canvasH = h;
        if (canvasW) canvasW.value = w;
        if (canvasH) canvasH.value = h;
        document.querySelectorAll('.size-preset-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        self.save();
        self.render();
      });
    });

    document.querySelectorAll('.preset-card').forEach(card => {
      card.addEventListener('click', function() {
        const presetName = this.dataset.preset;
        const preset = TagPresets[presetName];
        if (preset) {
          self.state = { ...self.state, ...preset };
          self.updateUI();
          self.save();
          self.render();
          document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
          this.classList.add('active');
          Toast.show(`Loaded preset: ${preset.text}`, 'success');
        }
      });
    });

    const iconUpload = document.getElementById('iconUpload');
    const iconFileInput = document.getElementById('iconFileInput');
    if (iconUpload) {
      iconUpload.addEventListener('click', () => iconFileInput && iconFileInput.click());
    }
    if (iconFileInput) {
      iconFileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            self.state.iconData = e.target.result;
            self.state.iconEnabled = true;
            const iconCheck = document.getElementById('iconEnabled');
            if (iconCheck) iconCheck.checked = true;
            self.updateConditionalFields();
            self.save();
            self.render();
            Toast.show('Icon loaded', 'success');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const removeIcon = document.getElementById('removeIcon');
    if (removeIcon) {
      removeIcon.addEventListener('click', function() {
        self.state.iconData = null;
        self.state.iconEnabled = false;
        const iconCheck = document.getElementById('iconEnabled');
        if (iconCheck) iconCheck.checked = false;
        self.updateConditionalFields();
        self.save();
        self.render();
      });
    }

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        self.state = Storage.getDefaultState();
        self.updateUI();
        self.save();
        self.render();
        Toast.show('Editor reset', 'info');
      });
    }
  },

  updateUI() {
    const s = this.state;

    document.querySelectorAll('[data-prop]').forEach(el => {
      const prop = el.dataset.prop;
      const type = el.dataset.type || 'input';
      if (s[prop] === undefined) return;

      if (type === 'checkbox') {
        el.checked = !!s[prop];
      } else if (type === 'color') {
        el.value = s[prop];
      } else {
        el.value = s[prop];
      }
    });

    document.querySelectorAll('[data-hex]').forEach(el => {
      const prop = el.dataset.hex;
      if (s[prop] !== undefined) el.value = s[prop];
    });

    const canvasW = document.getElementById('canvasW');
    const canvasH = document.getElementById('canvasH');
    if (canvasW) canvasW.value = s.canvasW;
    if (canvasH) canvasH.value = s.canvasH;

    document.querySelectorAll('.size-preset-btn').forEach(btn => {
      const w = parseInt(btn.dataset.w);
      const h = parseInt(btn.dataset.h);
      btn.classList.toggle('active', w === s.canvasW && h === s.canvasH);
    });

    this.updateConditionalFields();
  },

  updateConditionalFields() {
    const s = this.state;

    const gradFields = document.getElementById('gradientFields');
    if (gradFields) gradFields.classList.toggle('visible', !!s.gradient);

    const glowFields = document.getElementById('glowFields');
    if (glowFields) glowFields.classList.toggle('visible', !!s.glow);

    const shadowFields = document.getElementById('shadowFields');
    if (shadowFields) shadowFields.classList.toggle('visible', !!s.shadow);

    const iconPreview = document.getElementById('iconPreview');
    const iconUploadArea = document.getElementById('iconUploadArea');
    if (s.iconEnabled && s.iconData) {
      if (iconPreview) {
        iconPreview.classList.add('visible');
        iconPreview.querySelector('img').src = s.iconData;
      }
      if (iconUploadArea) iconUploadArea.style.display = 'none';
    } else {
      if (iconPreview) iconPreview.classList.remove('visible');
      if (iconUploadArea) iconUploadArea.style.display = 'block';
    }

    const borderFields = document.getElementById('borderFields');
    if (borderFields) borderFields.style.display = s.borderEnabled ? 'block' : 'none';

    const radiusFields = document.getElementById('radiusFields');
    if (radiusFields) radiusFields.style.display = (s.shape === 'rounded' || s.shape === 'pill') ? 'block' : 'none';
  },

  populateColorPalette() {
    const container = document.getElementById('mcColorPalette');
    if (!container) return;
    container.innerHTML = '';
    this.MC_COLORS.forEach(color => {
      const btn = document.createElement('button');
      btn.className = 'mc-color-btn';
      btn.style.backgroundColor = color.hex;
      btn.title = `${color.name} (${color.code})`;
      btn.setAttribute('aria-label', `Select ${color.name} color`);
      btn.innerHTML = `<span class="tooltip">${color.name}<br>${color.code}</span>`;
      btn.addEventListener('click', () => {
        this.state.textColor = color.hex;
        const textInput = document.getElementById('textColor');
        const hexInput = document.getElementById('textColorHex');
        if (textInput) textInput.value = color.hex;
        if (hexInput) hexInput.value = color.hex;
        document.querySelectorAll('.mc-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.save();
        this.render();
      });
      container.appendChild(btn);
    });
  },

  populateFonts() {
    const select = document.getElementById('fontSelect');
    if (!select) return;
    select.innerHTML = '';
    this.FONTS.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      select.appendChild(opt);
    });
    select.value = this.state.font;
  },

  populateSizes() {
    const container = document.getElementById('sizePresets');
    if (!container) return;
    container.innerHTML = '';
    this.CANVAS_SIZES.forEach(size => {
      const btn = document.createElement('button');
      btn.className = 'size-preset-btn';
      btn.dataset.w = size.w;
      btn.dataset.h = size.h;
      btn.textContent = `${size.w}×${size.h}`;
      btn.setAttribute('aria-label', `Set canvas size to ${size.w} by ${size.h}`);
      btn.addEventListener('click', () => {
        this.state.canvasW = size.w;
        this.state.canvasH = size.h;
        const canvasW = document.getElementById('canvasW');
        const canvasH = document.getElementById('canvasH');
        if (canvasW) canvasW.value = size.w;
        if (canvasH) canvasH.value = size.h;
        document.querySelectorAll('.size-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.save();
        this.render();
      });
      container.appendChild(btn);
    });
  },

  populatePresets() {
    const container = document.getElementById('presetsGrid');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(TagPresets).forEach(key => {
      const preset = TagPresets[key];
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.dataset.preset = key;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Load ${preset.text} preset`);
      card.innerHTML = `
        <div class="preset-preview" style="
          background:${preset.bgType === 'transparent' ? 'transparent' : preset.bgColor};
          color:${preset.textColor};
          font-weight:${preset.bold ? 'bold' : 'normal'};
          padding:2px 6px;
          border-radius:2px;
          font-size:10px;
          text-align:center;
          margin-bottom:6px;
        ">${preset.text}</div>
        <div class="preset-name" style="font-size:11px;color:var(--text-muted);text-align:center;">${preset.text}</div>
      `;
      card.addEventListener('click', () => {
        this.state = { ...this.state, ...preset };
        this.updateUI();
        this.save();
        this.render();
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        Toast.show(`Loaded: ${preset.text}`, 'success');
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
      container.appendChild(card);
    });
  },

  save() {
    Storage.saveLastProject(this.state);
  },

  render() {
    if (this.onChange) this.onChange(this.state);
  },

  getState() {
    return { ...this.state };
  },

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateUI();
    this.save();
    this.render();
  }
};

if (typeof module !== 'undefined') module.exports = Editor;
