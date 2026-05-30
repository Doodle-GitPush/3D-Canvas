import * as THREE from 'three';
import { gsap } from 'gsap';

const DEFAULT_BG = '#F8F8F8';
const DEFAULT_BADGE = '#09090b';

export class Card {
  constructor(data, scene) {
    this.data = data;
    this.scene = scene;
    this.meshGroup = new THREE.Group();

    this.width = 8.4;
    this.height = 5.6;

    this.isHovered = false;
    this.isFocused = false;
    this._destroyed = false;

    this.floatOffset = Math.random() * Math.PI * 2;
    this.floatSpeed = 0.2 + Math.random() * 0.2;

    this._init();
  }

  _init() {
    // Border backing plane
    const borderGeo = new THREE.PlaneGeometry(this.width + 0.07, this.height + 0.07);
    this.borderMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#e4e4e7'),
      side: THREE.DoubleSide,
    });
    this.borderMesh = new THREE.Mesh(borderGeo, this.borderMat);
    this.meshGroup.add(this.borderMesh);

    // Main plate — start with placeholder canvas, swap in logo async
    const plateGeo = new THREE.PlaneGeometry(this.width, this.height);
    const placeholderTex = this._buildPlaceholderTexture();
    this.plateMat = new THREE.MeshBasicMaterial({
      map: placeholderTex,
      side: THREE.DoubleSide,
    });
    this.plateMesh = new THREE.Mesh(plateGeo, this.plateMat);
    this.plateMesh.position.z = 0.01;
    this.plateMesh.userData.parentCard = this;
    this.meshGroup.add(this.plateMesh);

    // Async load logo and rebuild texture
    if (this.data.imageUrl) {
      this._loadLogoTexture(this.data.imageUrl);
    }

    this.scene.add(this.meshGroup);
  }

  /**
   * Builds the full card canvas texture given a loaded logo image (or null)
   */
  _buildCardTexture(logoImg) {
    const W = 840, H = 560;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const accent = this.data.accent;
    const bg = accent?.bg || DEFAULT_BG;
    const badgeColor = accent?.badge || DEFAULT_BADGE;
    const badgeText = accent?.badgeText || '#fff';

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle dot grid pattern
    ctx.fillStyle = badgeColor + '18'; // very transparent
    for (let gx = 20; gx < W; gx += 28) {
      for (let gy = 20; gy < H - 130; gy += 28) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Logo / Image ─────────────────────────────────────────────────────────
    const imgAreaH = H - 130;
    if (logoImg) {
      // Draw logo centered in top area
      const maxLogoSize = 110;
      const logoSize = Math.min(maxLogoSize, logoImg.width, logoImg.height);
      const lx = (W - logoSize) / 2;
      const ly = (imgAreaH - logoSize) / 2;

      // Logo shadow circle
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.08)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(W / 2, imgAreaH / 2, logoSize / 2 + 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      // Clip logo to rounded rect
      ctx.save();
      ctx.beginPath();
      this._roundRect(ctx, lx, ly, logoSize, logoSize, 18);
      ctx.clip();
      ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
      ctx.restore();
    }

    // ── Divider ─────────────────────────────────────────────────────────────
    ctx.fillStyle = badgeColor + '14';
    ctx.fillRect(0, imgAreaH, W, 1);

    // ── Bottom Strip ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, imgAreaH, W, 130);

    // Tool name
    ctx.font = '700 28px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = '#09090b';
    ctx.fillText(this._truncate(this.data.name || 'Untitled', 22), 24, imgAreaH + 42);

    // Tagline
    ctx.font = '400 17px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText(this._truncate(this.data.tagline || '', 48), 24, imgAreaH + 72);

    // Creator
    ctx.font = '500 14px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`by ${this._truncate(this.data.creator || '', 30)}`, 24, imgAreaH + 100);

    // Category badge (top-right of strip)
    const badgeLabel = this.data.accent?.label || this.data.category || 'Tool';
    ctx.font = '700 13px "Space Grotesk", system-ui, sans-serif';
    const bw = ctx.measureText(badgeLabel).width + 20;
    const bh = 26;
    const bx = W - bw - 18;
    const by = imgAreaH + 18;
    ctx.beginPath();
    this._roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fillStyle = badgeColor;
    ctx.fill();
    ctx.fillStyle = badgeText;
    ctx.fillText(badgeLabel, bx + 10, by + 18);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Placeholder texture shown while logo loads
   */
  _buildPlaceholderTexture() {
    const W = 840, H = 560;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const accent = this.data.accent;
    const bg = accent?.bg || DEFAULT_BG;
    const badgeColor = accent?.badge || DEFAULT_BADGE;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Dot grid
    ctx.fillStyle = badgeColor + '18';
    for (let gx = 20; gx < W; gx += 28) {
      for (let gy = 20; gy < H - 130; gy += 28) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Placeholder circle
    const imgAreaH = H - 130;
    ctx.beginPath();
    ctx.arc(W / 2, imgAreaH / 2, 44, 0, Math.PI * 2);
    ctx.fillStyle = badgeColor + '18';
    ctx.fill();

    // Bottom strip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, imgAreaH, W, 130);

    ctx.font = '700 28px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = '#09090b';
    ctx.fillText(this._truncate(this.data.name || 'Untitled', 22), 24, imgAreaH + 42);

    ctx.font = '400 17px "Space Grotesk", system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText(this._truncate(this.data.tagline || '', 48), 24, imgAreaH + 72);

    // Badge
    const badgeLabel = this.data.accent?.label || this.data.category || 'Tool';
    ctx.font = '700 13px "Space Grotesk", system-ui, sans-serif';
    const bw = ctx.measureText(badgeLabel).width + 20;
    ctx.beginPath();
    this._roundRect(ctx, W - bw - 18, imgAreaH + 18, bw, 26, 6);
    ctx.fillStyle = badgeColor;
    ctx.fill();
    ctx.fillStyle = accent?.badgeText || '#fff';
    ctx.fillText(badgeLabel, W - bw - 8, imgAreaH + 36);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Loads logo image and updates the material with the full card texture
   */
  _loadLogoTexture(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this._destroyed) return;
      const tex = this._buildCardTexture(img);
      if (this.plateMat.map) this.plateMat.map.dispose();
      this.plateMat.map = tex;
      this.plateMat.needsUpdate = true;
    };
    img.onerror = () => {
      // Keep placeholder — it already shows name/category fine
    };
    img.src = url;
  }

  _roundRect(ctx, x, y, w, h, r) {
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
  }

  _truncate(str, max) {
    return str && str.length > max ? str.slice(0, max - 1) + '…' : str || '';
  }

  onHover(val) {
    if (this.isHovered === val || this.isFocused) return;
    this.isHovered = val;

    if (val) {
      gsap.to(this.meshGroup.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.3, ease: 'power2.out' });
      gsap.to(this.borderMesh.material.color, { r: 0.035, g: 0.035, b: 0.047, duration: 0.2 });
    } else {
      gsap.to(this.meshGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power3.out' });
      gsap.to(this.borderMesh.material.color, { r: 0.894, g: 0.894, b: 0.905, duration: 0.3 });
      gsap.to(this.plateMesh.rotation, { x: 0, y: 0, duration: 0.4 });
    }
  }

  tilt(normCursor) {
    if (!this.isHovered || this.isFocused) return;
    gsap.to(this.plateMesh.rotation, {
      x: -normCursor.y * 0.1,
      y: normCursor.x * 0.1,
      duration: 0.3,
      ease: 'power1.out',
    });
  }

  setFocus(val) {
    this.isFocused = val;
    if (val) {
      gsap.to(this.plateMesh.rotation, { x: 0, y: 0, duration: 0.5 });
      gsap.to(this.borderMesh.material.color, { r: 0.035, g: 0.035, b: 0.047, duration: 0.2 });
    } else {
      this.isHovered = false;
      gsap.to(this.meshGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power3.out' });
      gsap.to(this.borderMesh.material.color, { r: 0.894, g: 0.894, b: 0.905, duration: 0.3 });
    }
  }

  update(time) {
    if (!this.isFocused) {
      if (this.originalY === undefined) this.originalY = this.meshGroup.position.y;
      this.meshGroup.position.y = this.originalY + Math.sin(time * this.floatSpeed + this.floatOffset) * 0.05;
      this.meshGroup.rotation.z = Math.sin(time * 0.08 + this.floatOffset) * 0.004;
    }
  }

  destroy() {
    this._destroyed = true;
    this.scene.remove(this.meshGroup);
    this.plateMesh.geometry.dispose();
    this.borderMesh.geometry.dispose();
    if (this.plateMat.map) this.plateMat.map.dispose();
    this.plateMat.dispose();
    this.borderMesh.material.dispose();
  }
}
