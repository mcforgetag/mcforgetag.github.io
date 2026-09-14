const CanvasRenderer = {
  canvas: null,
  ctx: null,
  offscreen: null,
  offCtx: null,
  iconCache: {},

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: false });
    this.setupOffscreen();
  },

  setupOffscreen() {
    this.offscreen = document.createElement('canvas');
    this.offCtx = this.offscreen.getContext('2d', { willReadFrequently: false });
  },

  disableSmoothing(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.textRendering = 'optimizeSpeed';
  },

  setCanvasSize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.offscreen.width = w;
    this.offscreen.height = h;
  },

  getPreviewScale(w, h) {
    const minDim = Math.min(w, h);
    if (minDim <= 16) return 8;
    if (minDim <= 32) return 4;
    if (minDim <= 64) return 3;
    if (minDim <= 128) return 2;
    return 1;
  },

  render(state) {
    const { canvasW, canvasH } = state;
    this.setCanvasSize(canvasW, canvasH);

    const ctx = this.offCtx;
    ctx.clearRect(0, 0, canvasW, canvasH);
    this.disableSmoothing(ctx);

    this.drawBackground(ctx, state);
    this.drawText(ctx, state);

    const previewScale = this.getPreviewScale(canvasW, canvasH);
    this.canvas.style.width = (canvasW * previewScale) + 'px';
    this.canvas.style.height = (canvasH * previewScale) + 'px';

    this.disableSmoothing(this.ctx);
    this.ctx.clearRect(0, 0, canvasW, canvasH);
    this.ctx.drawImage(this.offscreen, 0, 0);
  },

  drawBackground(ctx, state) {
    const { canvasW, canvasH, bgType, bgColor, bgOpacity, borderEnabled, borderColor, borderWidth, borderRadius, shape } = state;

    if (bgType === 'transparent') {
      if (borderEnabled && borderWidth > 0) {
        this.drawBorder(ctx, state);
      }
      return;
    }

    const alpha = bgOpacity / 100;

    ctx.save();

    if (shape === 'pill') {
      const r = canvasH / 2;
      this.roundRect(ctx, 0, 0, canvasW, canvasH, r);
      ctx.clip();
    } else if (shape === 'rounded' && borderRadius > 0) {
      this.roundRect(ctx, 0, 0, canvasW, canvasH, borderRadius);
      ctx.clip();
    }

    if (bgType === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
      grad.addColorStop(0, this.hexToRgba(bgColor, alpha));
      grad.addColorStop(1, this.hexToRgba(this.darkenColor(bgColor, 0.3), alpha));
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = this.hexToRgba(bgColor, alpha);
    }

    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();

    if (borderEnabled && borderWidth > 0) {
      this.drawBorder(ctx, state);
    }
  },

  drawBorder(ctx, state) {
    const { canvasW, canvasH, borderColor, borderWidth, borderRadius, shape } = state;

    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    if (shape === 'pill') {
      const r = canvasH / 2;
      this.roundRect(ctx, borderWidth / 2, borderWidth / 2, canvasW - borderWidth, canvasH - borderWidth, Math.max(1, r - borderWidth / 2));
      ctx.stroke();
    } else if (shape === 'rounded' && borderRadius > 0) {
      const r = Math.max(1, borderRadius - borderWidth / 2);
      this.roundRect(ctx, borderWidth / 2, borderWidth / 2, canvasW - borderWidth, canvasH - borderWidth, r);
      ctx.stroke();
    } else {
      ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvasW - borderWidth, canvasH - borderWidth);
    }

    ctx.restore();
  },

  drawText(ctx, state) {
    const {
      text, font, fontSize, textColor, textOutline, outlineColor, outlineSize,
      bold, italic, underline, shadow, shadowColor, shadowBlur,
      glow, glowColor, glowStrength, glowOpacity,
      gradient, gradientColor1, gradientColor2, gradientDir,
      paddingL, paddingR, paddingT, paddingB,
      canvasW, canvasH,
      iconEnabled, iconData, iconSize, iconPosition, iconSpacing
    } = state;

    const fontStyle = (italic ? 'italic ' : '') + (bold ? 'bold ' : '');
    const fontStr = `${fontStyle}${fontSize}px ${this.getFontFamily(font)}`;
    ctx.font = fontStr;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    this.disableSmoothing(ctx);

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = fontSize;

    let iconW = 0;
    let iconSpacingVal = 0;
    if (iconEnabled && iconData) {
      iconW = iconSize;
      iconSpacingVal = iconSpacing;
    }

    const totalW = textW + (iconEnabled && iconData ? iconW + iconSpacingVal : 0) + paddingL + paddingR;
    const totalH = textH + paddingT + paddingB;

    let startX = Math.round((canvasW - totalW) / 2);
    let startY = Math.round((canvasH - totalH) / 2);

    startX = Math.max(paddingL, startX);
    startY = Math.max(paddingT, startY);

    const textX = iconPosition === 'right'
      ? startX
      : startX + (iconEnabled && iconData ? iconW + iconSpacingVal : 0);
    const textY = startY + paddingT;

    const fillGrad = gradient
      ? this.createGradientText(ctx, gradientColor1, gradientColor2, textX, textY, textW, textH, gradientDir)
      : null;

    if (glow) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowStrength;
      ctx.globalAlpha = glowOpacity / 100;
      ctx.fillStyle = fillGrad || textColor;
      ctx.fillText(text, textX, textY);
      ctx.restore();
    }

    if (shadow) {
      ctx.save();
      ctx.shadowColor = shadowColor || '#000000';
      ctx.shadowBlur = shadowBlur || 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#000000';
      ctx.fillText(text, textX, textY);
      ctx.restore();
    }

    if (textOutline && outlineSize > 0) {
      ctx.save();
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineSize * 2;
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(text, textX, textY);
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = fillGrad || textColor;
    ctx.fillText(text, textX, textY);
    ctx.restore();

    if (underline) {
      ctx.save();
      ctx.fillStyle = fillGrad || textColor;
      ctx.fillRect(textX, textY + textH - 1, textW, 1);
      ctx.restore();
    }

    if (iconEnabled && iconData) {
      this.drawIcon(ctx, iconData, startX, startY, textX, textW, iconW, iconSpacingVal, totalH, iconPosition);
    }
  },

  drawIcon(ctx, iconData, startX, startY, textX, textW, iconW, iconSpacing, totalH, iconPosition) {
    const self = this;

    const renderIcon = (img) => {
      const ix = iconPosition === 'left' ? startX : textX + textW + iconSpacing;
      const iy = startY + Math.round((totalH - iconW) / 2);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, ix, iy, iconW, iconW);
    };

    if (this.iconCache[iconData]) {
      renderIcon(this.iconCache[iconData]);
      return;
    }

    const img = new Image();
    img.src = iconData;
    if (img.complete && img.naturalWidth > 0) {
      this.iconCache[iconData] = img;
      renderIcon(img);
    } else {
      img.onload = function() {
        self.iconCache[iconData] = img;
        self.render(self._lastState || {});
      };
    }
  },

  createGradientText(ctx, color1, color2, x, y, w, h, dir) {
    let grad;
    if (dir === 'vertical') {
      grad = ctx.createLinearGradient(x, y, x, y + h);
    } else if (dir === 'diagonal') {
      grad = ctx.createLinearGradient(x, y, x + w, y + h);
    } else {
      grad = ctx.createLinearGradient(x, y, x + w, y);
    }
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    return grad;
  },

  getFontFamily(font) {
    const families = {
      'Minecraft': "'Minecraft', 'Press Start 2P', monospace",
      'Pixel': "'Press Start 2P', monospace",
      'Pixel Bold': "'Press Start 2P', monospace",
      'Minecraft Bold': "'Minecraft', 'Press Start 2P', monospace",
      'Arial': 'Arial, sans-serif',
      'Verdana': 'Verdana, sans-serif',
      'Inter': "'Inter', 'Segoe UI', sans-serif"
    };
    return families[font] || families['Minecraft'];
  },

  hexToRgba(hex, alpha) {
    if (!hex || hex.length < 7) return `rgba(0,0,0,${alpha || 1})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  darkenColor(hex, amount) {
    if (!hex || hex.length < 7) return hex || '#000000';
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.round(r * (1 - amount));
    g = Math.round(g * (1 - amount));
    b = Math.round(b * (1 - amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },

  roundRect(ctx, x, y, w, h, r) {
    r = Math.min(Math.max(0, r), w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  getPreviewDataURL() {
    return this.canvas.toDataURL('image/png');
  },

  measureText(state) {
    const ctx = this.offCtx;
    const fontStyle = (state.italic ? 'italic ' : '') + (state.bold ? 'bold ' : '');
    const fontStr = `${fontStyle}${state.fontSize}px ${this.getFontFamily(state.font)}`;
    ctx.font = fontStr;
    const metrics = ctx.measureText(state.text);
    return {
      textWidth: Math.ceil(metrics.width),
      textHeight: state.fontSize,
      totalWidth: Math.ceil(metrics.width) + state.paddingL + state.paddingR,
      totalHeight: state.fontSize + state.paddingT + state.paddingB
    };
  },

  checkFit(state) {
    const m = this.measureText(state);
    return m.totalWidth <= state.canvasW && m.totalHeight <= state.canvasH;
  }
};

if (typeof module !== 'undefined') module.exports = CanvasRenderer;
