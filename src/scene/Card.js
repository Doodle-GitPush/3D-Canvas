import * as THREE from 'three';
import { gsap } from 'gsap';

export class Card {
  /**
   * @param {Object} data - Card data (api-image | text)
   * @param {THREE.Scene} scene - Parent WebGL scene
   */
  constructor(data, scene) {
    this.data = data;
    this.scene = scene;
    this.meshGroup = new THREE.Group();

    // Card proportions — landscape 3:2
    this.width = 8.4;
    this.height = 5.6;

    this.isHovered = false;
    this.isFocused = false;

    this.floatOffset = Math.random() * Math.PI * 2;
    this.floatSpeed = 0.25 + Math.random() * 0.25;

    this.init();
  }

  init() {
    // 1. Border backing plane
    const borderGeo = new THREE.PlaneGeometry(this.width + 0.06, this.height + 0.06);
    this.borderMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#e4e4e7'),
      side: THREE.DoubleSide,
    });
    this.borderMesh = new THREE.Mesh(borderGeo, this.borderMat);
    this.meshGroup.add(this.borderMesh);

    // 2. Main plate
    const plateGeo = new THREE.PlaneGeometry(this.width, this.height);
    let material;

    if (this.data.type === 'api-image' && this.data.imageUrl) {
      // Show placeholder color while image loads
      material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.data.color || '#f4f4f5'),
        side: THREE.DoubleSide,
      });

      // Async load the real image texture
      const loader = new THREE.TextureLoader();
      loader.load(
        this.data.imageUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          // Blend loaded image into existing material
          if (this.plateMesh && !this._destroyed) {
            this.plateMesh.material.map = texture;
            this.plateMesh.material.color.set('#ffffff');
            this.plateMesh.material.needsUpdate = true;
          }
        },
        undefined,
        () => {
          // On error: keep the placeholder color, add a subtle pattern overlay
          if (this.plateMesh && !this._destroyed) {
            const fallbackTex = this._createFallbackTexture();
            this.plateMesh.material.map = fallbackTex;
            this.plateMesh.material.needsUpdate = true;
          }
        }
      );
    } else if (this.data.type === 'image' && this.data.url) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(this.data.url);
      texture.colorSpace = THREE.SRGBColorSpace;
      material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    } else {
      const canvasTexture = this._createTextCanvasTexture();
      material = new THREE.MeshBasicMaterial({ map: canvasTexture, side: THREE.DoubleSide });
    }

    this.plateMesh = new THREE.Mesh(plateGeo, material);
    this.plateMesh.position.z = 0.01;
    this.meshGroup.add(this.plateMesh);

    // 3. Info strip overlay (only for api-image cards)
    if (this.data.type === 'api-image') {
      this._addInfoStrip();
    }

    this.plateMesh.userData.parentCard = this;
    this.scene.add(this.meshGroup);
  }

  /**
   * Adds a bottom info strip: author name, likes, source badge
   */
  _addInfoStrip() {
    const stripH = 0.9;
    const stripGeo = new THREE.PlaneGeometry(this.width, stripH);

    const canvas = document.createElement('canvas');
    canvas.width = 840;
    canvas.height = 90;
    const ctx = canvas.getContext('2d');

    // Semi-transparent white strip
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(0, 0, 840, 90);

    // Author name
    ctx.font = '600 22px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#09090b';
    ctx.fillText(this._truncate(this.data.author || 'Unknown', 34), 24, 36);

    // Title / query
    ctx.font = '400 16px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText(this._truncate(this.data.title || '', 50), 24, 62);

    // Source badge (right side)
    const badgeLabel = this.data.source === 'unsplash' ? 'Unsplash' : 'Pexels';
    const badgeColor = this.data.source === 'unsplash' ? '#000000' : '#05A081';

    ctx.font = '700 14px "Space Grotesk", sans-serif';
    ctx.fillStyle = badgeColor;
    const badgeW = ctx.measureText(badgeLabel).width + 20;
    ctx.fillStyle = this.data.source === 'unsplash' ? '#f4f4f5' : '#e6faf6';
    ctx.roundRect(840 - badgeW - 18, 28, badgeW, 28, 4);
    ctx.fill();
    ctx.fillStyle = badgeColor;
    ctx.fillText(badgeLabel, 840 - badgeW - 8, 48);

    // Likes (if any)
    if (this.data.likes > 0) {
      ctx.font = '500 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#a1a1aa';
      const likeStr = `♥ ${this._formatNum(this.data.likes)}`;
      const likeW = ctx.measureText(likeStr).width;
      ctx.fillText(likeStr, 840 - badgeW - likeW - 36, 62);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.stripMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    this.stripMesh = new THREE.Mesh(stripGeo, this.stripMat);

    // Position strip at bottom of card
    this.stripMesh.position.set(0, -(this.height / 2) + stripH / 2, 0.02);
    this.meshGroup.add(this.stripMesh);
  }

  _truncate(str, maxLen) {
    return str && str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str || '';
  }

  _formatNum(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  _createFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 171;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this.data.color || '#f4f4f5';
    ctx.fillRect(0, 0, 256, 171);
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1;
    for (let x = 0; x < 256; x += 32) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 171); ctx.stroke();
    }
    for (let y = 0; y < 171; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Generates a canvas texture for text cards
   */
  _createTextCanvasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 341;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 341);

    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, 480, 309);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, 472, 301);

    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText((this.data.category || 'QUOTE').toUpperCase(), 42, 55);

    ctx.font = '500 64px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#18181b';
    ctx.fillText('\u201c', 38, 110);

    ctx.font = '400 21px "Outfit", sans-serif';
    ctx.fillStyle = '#18181b';

    const words = (this.data.text || '').split(' ');
    let line = '';
    const lines = [];
    const maxWidth = 420;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    let y = 145;
    for (const l of lines) { ctx.fillText(l, 42, y); y += 30; }

    ctx.font = '700 14px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#09090b';
    ctx.fillText(`\u2014 ${(this.data.author || '').toUpperCase()}`, 42, 310);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  onHover(val) {
    if (this.isHovered === val || this.isFocused) return;
    this.isHovered = val;

    if (val) {
      gsap.to(this.meshGroup.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.35, ease: 'power2.out' });
      gsap.to(this.borderMesh.material.color, { r: 0.035, g: 0.035, b: 0.047, duration: 0.2 });
    } else {
      gsap.to(this.meshGroup.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power3.out' });
      gsap.to(this.borderMesh.material.color, { r: 0.894, g: 0.894, b: 0.905, duration: 0.3 });
      gsap.to(this.plateMesh.rotation, { x: 0, y: 0, duration: 0.4 });
    }
  }

  tilt(normCursor) {
    if (!this.isHovered || this.isFocused) return;
    const tiltX = -normCursor.y * 0.12;
    const tiltY = normCursor.x * 0.12;
    gsap.to(this.plateMesh.rotation, { x: tiltX, y: tiltY, duration: 0.3, ease: 'power1.out' });
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
      const floatVal = Math.sin(time * this.floatSpeed + this.floatOffset) * 0.06;
      this.meshGroup.position.y = this.originalY + floatVal;
      this.meshGroup.rotation.z = Math.sin(time * 0.1 + this.floatOffset) * 0.005;
    }
  }

  destroy() {
    this._destroyed = true;
    this.scene.remove(this.meshGroup);

    this.plateMesh.geometry.dispose();
    this.borderMesh.geometry.dispose();

    if (this.plateMesh.material.map) this.plateMesh.material.map.dispose();
    this.plateMesh.material.dispose();
    this.borderMesh.material.dispose();

    if (this.stripMesh) {
      this.stripMesh.geometry.dispose();
      if (this.stripMat.map) this.stripMat.map.dispose();
      this.stripMat.dispose();
    }
  }
}
