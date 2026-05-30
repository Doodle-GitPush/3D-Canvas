import * as THREE from 'three';
import { CardManager } from './CardManager';
import { ClusterManager } from './ClusterManager';
import { gsap } from 'gsap';

export class SpaceScene {
  /**
   * @param {HTMLCanvasElement} canvasElement - WebGL target canvas
   * @param {Object} reactCallbacks - Callbacks to sync state back to React UI
   */
  constructor(canvasElement, reactCallbacks, designFeed) {
    this.canvas = canvasElement;
    this.callbacks = reactCallbacks;
    this.designFeed = designFeed || null;
    
    // Smooth damping targets
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraZ = 45; // Starts zoomed out to see the initial cloud
    
    this.targetCameraX = 0;
    this.targetCameraY = 0;
    this.targetCameraZ = 45;
    
    // Drag-Panning pointers tracking
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startCameraX = 0;
    this.startCameraY = 0;
    
    // 2-Finger multitouch pointers tracking (for touch pinch-zoom)
    this.activeTouches = new Map();
    this.startTouchDistance = 0;
    this.startTouchCameraZ = 45;
    
    // Raycasting Click Focus
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredCard = null;
    this.focusedCard = null;
    this.isTransitioning = false;
    
    this.init();
  }

  init() {
    // 1. Scene & Deep White Void Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#ffffff'); // Solid white void
    this.scene.fog = new THREE.FogExp2('#ffffff', 0.009); // Slightly denser fog to make deep cards fade cleanly
    
    // 2. Camera Configuration
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(this.cameraX, this.cameraY, this.cameraZ);
    
    // 3. Crisp WebGL Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 4. Card Manager (Spherical coordinates scattering cloud)
    this.cardManager = new CardManager(this.scene, this.designFeed);

    // 4b. Cluster Manager (design-area zones visible when zoomed out)
    this.clusterManager = new ClusterManager(this.scene);
    
    // 5. Ambient White Lighting
    this.setupLighting();
    
    // 6. Figma-style 2-Finger trackpad & Pointer dragging
    this.bindEvents();
    
    // Sync React HUD
    this.notifyHUD();
    
    // Start Loop
    this.clock = new THREE.Clock();
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.5);
    this.scene.add(ambientLight);
    
    const dirLight1 = new THREE.DirectionalLight('#ffffff', 1.0);
    dirLight1.position.set(15, 30, 15);
    this.scene.add(dirLight1);
    
    const dirLight2 = new THREE.DirectionalLight('#ffffff', 0.6);
    dirLight2.position.set(-15, -30, -15);
    this.scene.add(dirLight2);
  }

  bindEvents() {
    // A. 1-Finger/Mouse Drag-to-Pan (Pointer Capture API)
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      
      this.canvas.setPointerCapture(e.pointerId);
      
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startCameraX = this.targetCameraX;
      this.startCameraY = this.targetCameraY;
      
      // Track screen contacts for touchscreens
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
      if (this.activeTouches.size === 2) {
        // Multi-touch Zoom init
        const points = Array.from(this.activeTouches.values());
        this.startTouchDistance = this.getDistance(points[0], points[1]);
        this.startTouchCameraZ = this.targetCameraZ;
        
        // Suppress single-pointer delta jumps
        this.isDragging = false;
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      // Raycasting cursor positions
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.handleRaycastHover();
      
      if (this.activeTouches.has(e.pointerId)) {
        this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      
      // 1. Touch Pinch-to-Zoom (2-finger pinch)
      if (this.activeTouches.size === 2) {
        const points = Array.from(this.activeTouches.values());
        const distance = this.getDistance(points[0], points[1]);
        const deltaDist = distance - this.startTouchDistance;
        
        const touchSpeed = 0.15;
        this.targetCameraZ = this.startTouchCameraZ - deltaDist * touchSpeed;
        
        // Scrolling zooms out focused card automatically
        if (this.focusedCard && deltaDist < -10) {
          this.unfocusCard();
        }
        
        this.notifyHUD();
        return;
      }
      
      // 2. Drag-Panning (1-finger / mouse)
      if (this.isDragging) {
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        
        // Panning sensitivity scales dynamically based on camera Z depth (zoom level)
        // Zoomed in close -> panning is slower/precise. Zoomed out far -> pans fast.
        const factor = Math.max(8.0, Math.abs(this.camera.position.z)) * 0.0016;
        
        this.targetCameraX = this.startCameraX - dx * factor;
        this.targetCameraY = this.startCameraY + dy * factor;
        
        // Auto unfocus currently focused card if dragged past threshold
        if (this.focusedCard && (Math.abs(dx) > 15 || Math.abs(dy) > 15)) {
          this.unfocusCard();
        }
        
        this.notifyHUD();
      }
    });

    const releasePointer = (e) => {
      this.isDragging = false;
      this.activeTouches.delete(e.pointerId);
      try {
        this.canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    this.canvas.addEventListener('pointerup', releasePointer);
    this.canvas.addEventListener('pointercancel', releasePointer);

    // B. Figma-Style 2-Finger Trackpad Panning & Pinch Zoom
    // Maps standard wheel events. Touchpads trigger e.ctrlKey=true during pinch gestures!
    // We prevent default browser zoom behaviour by utilizing non-passive { passive: false } hooks.
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      
      if (e.ctrlKey) {
        // 1. Pinch-to-Zoom Gesture (ctrlKey is true during touchpad pinches!)
        const pinchSpeed = 0.08;
        this.targetCameraZ += e.deltaY * pinchSpeed;
        
        if (this.focusedCard && e.deltaY > 0) {
          this.unfocusCard();
        }
      } else {
        // 2. Trackpad 2-Finger Panning (swiping horizontally/vertically without pinch)
        // deltaX pans X. deltaY pans Y.
        const panFactor = Math.max(8.0, Math.abs(this.camera.position.z)) * 0.0016;
        this.targetCameraX += e.deltaX * panFactor * 0.6;
        this.targetCameraY -= e.deltaY * panFactor * 0.6;
        
        if (this.focusedCard && (Math.abs(e.deltaX) > 5 || Math.abs(e.deltaY) > 5)) {
          this.unfocusCard();
        }
      }
      
      this.notifyHUD();
    }, { passive: false });

    // Block native Safari/macOS pinch gesture scaling
    this.gestureStartHandler = (e) => e.preventDefault();
    this.gestureChangeHandler = (e) => e.preventDefault();
    window.addEventListener('gesturestart', this.gestureStartHandler, { passive: false });
    window.addEventListener('gesturechange', this.gestureChangeHandler, { passive: false });

    // C. Click Raycast Inspector Trigger
    window.addEventListener('click', (e) => {
      if (e.target.closest('.react-overlay')) return;
      
      // Ignore click-focus check if they panned/dragged canvas significantly
      if (Math.abs(this.targetCameraX - this.startCameraX) > 0.5 || 
          Math.abs(this.targetCameraY - this.startCameraY) > 0.5) {
        return;
      }
      
      this.handleRaycastClick();
    });

    // D. Window Resize listeners
    this.resizeHandler = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  getDistance(p1, p2) {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  handleRaycastHover() {
    if (this.isDragging || this.activeTouches.size > 0) return;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const cardPlates = this.cardManager.cards.map(c => c.plateMesh);
    const intersects = this.raycaster.intersectObjects(cardPlates);
    
    if (intersects.length > 0) {
      const card = intersects[0].object.userData.parentCard;
      
      if (this.hoveredCard !== card) {
        if (this.hoveredCard) this.hoveredCard.onHover(false);
        this.hoveredCard = card;
        this.hoveredCard.onHover(true);
        
        document.body.style.cursor = 'pointer';
      }
      
      if (this.hoveredCard) {
        this.hoveredCard.tilt(this.mouse);
      }
    } else {
      if (this.hoveredCard) {
        this.hoveredCard.onHover(false);
        this.hoveredCard = null;
        document.body.style.cursor = 'default';
      }
    }
  }

  handleRaycastClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const cardPlates = this.cardManager.cards.map(c => c.plateMesh);
    const intersects = this.raycaster.intersectObjects(cardPlates);
    
    if (intersects.length > 0) {
      const card = intersects[0].object.userData.parentCard;
      this.focusOnCard(card);
    } else {
      if (this.focusedCard) {
        this.unfocusCard();
      }
    }
  }

  /**
   * Pans camera to focus directly centered on selected card
   */
  focusOnCard(card) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    this.focusedCard = card;
    card.setFocus(true);
    
    if (this.callbacks.onCardFocus) {
      this.callbacks.onCardFocus(card.data);
    }
    
    // Zoom straight in front of card
    const targetX = card.meshGroup.position.x;
    const targetY = card.meshGroup.position.y;
    const targetZ = card.meshGroup.position.z + 10.5; // Focus distance Z in front of card Z
    
    gsap.killTweensOf(this);
    
    gsap.to(this, {
      cameraX: targetX,
      cameraY: targetY,
      cameraZ: targetZ,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.targetCameraX = this.cameraX;
        this.targetCameraY = this.cameraY;
        this.targetCameraZ = this.cameraZ;
      },
      onComplete: () => {
        this.isTransitioning = false;
        this.notifyHUD();
      }
    });
  }

  unfocusCard() {
    if (this.focusedCard) {
      this.focusedCard.setFocus(false);
      this.focusedCard = null;
    }
    
    if (this.callbacks.onCardUnfocus) {
      this.callbacks.onCardUnfocus();
    }
  }

  notifyHUD() {
    if (this.callbacks.onHUDUpdate) {
      const formattedX = this.targetCameraX.toFixed(1);
      const formattedY = this.targetCameraY.toFixed(1);
      const formattedZ = Math.abs(this.targetCameraZ).toFixed(0);
      
      this.callbacks.onHUDUpdate({
        percent: `Depth: ${formattedZ}m`,
        depth: `X: ${formattedX} // Y: ${formattedY}`
      });
    }
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    const time = this.clock.getElapsedTime();
    
    // Smooth lerping damping to camera coordinates (panning/zooming feel)
    if (!this.isTransitioning) {
      const panDamping = 0.095;
      const zoomDamping = 0.15;
      
      this.cameraX += (this.targetCameraX - this.cameraX) * panDamping;
      this.cameraY += (this.targetCameraY - this.cameraY) * panDamping;
      this.cameraZ += (this.targetCameraZ - this.cameraZ) * zoomDamping;
    }
    
    // Update camera matrix
    this.camera.position.set(this.cameraX, this.cameraY, this.cameraZ);
    // Camera looks straight forward along Z
    this.camera.lookAt(new THREE.Vector3(this.cameraX, this.cameraY, this.cameraZ - 50));
    
    // 1. Procedural Infinite Chunk Spawning around current Camera coordinates (X, Y, Z)
    this.cardManager.updateChunks(this.cameraX, this.cameraY, this.cameraZ);
    
    // 2. Clean up far nodes outside viewport boundaries (drift-free backtrack-safe)
    this.cardManager.cleanupFarNodes(this.cameraX, this.cameraY, this.cameraZ);
    
    // 3. Update active card floating animations
    this.cardManager.update(time);
    
    // 4. Render
    this.renderer.render(this.scene, this.camera);

    // 5. Update cluster rings + project labels (after render so camera matrices are current)
    if (this.callbacks.onClusterUpdate) {
      const clusters = this.clusterManager.update(
        this.cameraZ, this.camera,
        window.innerWidth, window.innerHeight,
      );
      this.callbacks.onClusterUpdate(clusters);
    }
  }

  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('gesturestart', this.gestureStartHandler);
    window.removeEventListener('gesturechange', this.gestureChangeHandler);
    this.clusterManager.destroy();
    this.renderer.dispose();
  }
}
