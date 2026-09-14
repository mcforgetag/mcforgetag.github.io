const Exporter = {
  exportAsPNG(state, scale = 1) {
    const w = state.canvasW * scale;
    const h = state.canvasH * scale;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    this.drawBackgroundExport(ctx, state, scale);
    this.drawTextExport(ctx, state, scale);

    return exportCanvas;
  },

  drawBackgroundExport(ctx, state, scale) {
    const { bgType, bgColor, bgOpacity, shape, borderEnabled, borderColor, borderWidth, borderRadius, canvasW, canvasH } = state;
    const w = canvasW * scale;
    const h = canvasH * scale;

    if (bgType === 'transparent') {
      if (borderEnabled && borderWidth > 0) {
        this.drawBorderExport(ctx, state, scale);
      }
      return;
    }

    const alpha = bgOpacity / 100;

    ctx.save();

    if (shape === 'pill') {
      const r = h / 2;
      CanvasRenderer.roundRect(ctx, 0, 0, w, h, r);
      ctx.clip();
    } else if (shape === 'rounded' && borderRadius > 0) {
      CanvasRenderer.roundRect(ctx, 0, 0, w, h, borderRadius * scale);
      ctx.clip();
    }

    if (bgType === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      const c1 = CanvasRenderer.hexToRgba(bgColor, alpha);
      const c2 = CanvasRenderer.hexToRgba(CanvasRenderer.darkenColor(bgColor, 0.3), alpha);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = CanvasRenderer.hexToRgba(bgColor, alpha);
    }

    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    if (borderEnabled && borderWidth > 0) {
      this.drawBorderExport(ctx, state, scale);
    }
  },

  drawBorderExport(ctx, state, scale) {
    const { canvasW, canvasH, borderColor, borderWidth, borderRadius, shape } = state;
    const w = canvasW * scale;
    const h = canvasH * scale;
    const bw = borderWidth * scale;

    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = bw;

    if (shape === 'pill') {
      const r = Math.max(1, h / 2 - bw / 2);
      CanvasRenderer.roundRect(ctx, bw / 2, bw / 2, w - bw, h - bw, r);
      ctx.stroke();
    } else if (shape === 'rounded' && borderRadius > 0) {
      const r = Math.max(1, borderRadius * scale - bw / 2);
      CanvasRenderer.roundRect(ctx, bw / 2, bw / 2, w - bw, h - bw, r);
      ctx.stroke();
    } else {
      ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);
    }

    ctx.restore();
  },

  drawTextExport(ctx, state, scale) {
    const {
      text, font, fontSize, textColor, textOutline, outlineColor, outlineSize,
      bold, italic, underline, shadow, shadowColor, shadowBlur,
      glow, glowColor, glowStrength, glowOpacity,
      gradient, gradientColor1, gradientColor2, gradientDir,
      paddingL, paddingR, paddingT, paddingB,
      canvasW, canvasH,
      iconEnabled, iconData, iconSize, iconPosition, iconSpacing
    } = state;

    const scaledFontSize = fontSize * scale;
    const fontStyle = (italic ? 'italic ' : '') + (bold ? 'bold ' : '');
    const fontStr = `${fontStyle}${scaledFontSize}px ${CanvasRenderer.getFontFamily(font)}`;
    ctx.font = fontStr;
    ctx.textBaseline = 'top';

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = scaledFontSize;

    let iconW = 0;
    let iconSpacingScaled = 0;
    if (iconEnabled && iconData) {
      iconW = iconSize * scale;
      iconSpacingScaled = iconSpacing * scale;
    }

    const totalW = textW + (iconEnabled && iconData ? iconW + iconSpacingScaled : 0) + paddingL * scale + paddingR * scale;
    const totalH = textH + paddingT * scale + paddingB * scale;

    let startX = Math.round((canvasW * scale - totalW) / 2);
    let startY = Math.round((canvasH * scale - totalH) / 2);
    startX = Math.max(paddingL * scale, startX);
    startY = Math.max(paddingT * scale, startY);

    const textX = iconPosition === 'right'
      ? startX
      : startX + (iconEnabled && iconData ? iconW + iconSpacingScaled : 0);
    const textY = startY + paddingT * scale;

    if (glow) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowStrength * scale;
      ctx.globalAlpha = glowOpacity / 100;
      ctx.fillStyle = gradient ? this.getGradient(ctx, gradientColor1, gradientColor2, textX, textY, textW, textH, gradientDir) : textColor;
      ctx.fillText(text, textX, textY);
      ctx.restore();
    }

    if (shadow) {
      ctx.save();
      ctx.shadowColor = shadowColor || '#000000';
      ctx.shadowBlur = (shadowBlur || 2) * scale;
      ctx.shadowOffsetX = scale;
      ctx.shadowOffsetY = scale;
      ctx.fillStyle = '#000000';
      ctx.fillText(text, textX, textY);
      ctx.restore();
    }

    if (textOutline && outlineSize > 0) {
      ctx.save();
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineSize * 2 * scale;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(text, textX, textY);
      ctx.restore();
    }

    ctx.save();
    if (gradient) {
      ctx.fillStyle = this.getGradient(ctx, gradientColor1, gradientColor2, textX, textY, textW, textH, gradientDir);
    } else {
      ctx.fillStyle = textColor;
    }
    ctx.fillText(text, textX, textY);
    ctx.restore();

    if (underline) {
      ctx.save();
      ctx.fillStyle = gradient ? this.getGradient(ctx, gradientColor1, gradientColor2, textX, textY + textH - scale, textW, scale, gradientDir) : textColor;
      ctx.fillRect(textX, textY + textH - scale, textW, scale);
      ctx.restore();
    }

    if (iconEnabled && iconData) {
      const img = new Image();
      img.src = iconData;
      if (img.complete && img.naturalWidth > 0) {
        const ix = iconPosition === 'left' ? startX : textX + textW + iconSpacingScaled;
        const iy = startY + Math.round((totalH - iconW) / 2);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, ix, iy, iconW, iconW);
      } else {
        img.onload = function() {
          const ix = iconPosition === 'left' ? startX : textX + textW + iconSpacingScaled;
          const iy = startY + Math.round((totalH - iconW) / 2);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, ix, iy, iconW, iconW);
        };
      }
    }
  },

  getGradient(ctx, color1, color2, x, y, w, h, dir) {
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

  downloadPNG(canvas, filename) {
    canvas.toBlob(function(blob) {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');
  },

  generateItemsAdderConfig(state, namespace, textureName) {
    const config = `items:
  ${textureName}:
    display_name: "${state.text}"
    resource:
      material: PAPER
      generate: false
      textures:
        - ${namespace}/${textureName}
    events: {}`;
    return config;
  },

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }
};

if (typeof module !== 'undefined') module.exports = Exporter;
