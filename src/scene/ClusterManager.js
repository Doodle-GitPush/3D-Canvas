import * as THREE from 'three';
import { clusters } from './clusters';
import { seedTools } from '../data/seedTools';
import { gsap } from 'gsap';

export class ClusterManager {
  /**
   * @param {import('./CardManager').CardManager} cardManager
   */
  constructor(cardManager) {
    this.cardManager = cardManager;
    this.clusters = clusters;
    this.populatedClusters = new Set();

    // User-submitted tools (added at runtime)
    this.userTools = [];

    // Build per-category tool lookup
    this._toolsByCategory = {};
    for (const cat of Object.values(clusters.map(c => c.category))) {
      this._toolsByCategory[cat] = [];
    }
    for (const tool of seedTools) {
      if (!this._toolsByCategory[tool.category]) {
        this._toolsByCategory[tool.category] = [];
      }
      this._toolsByCategory[tool.category].push({ ...tool, type: 'tool' });
    }
  }

  /**
   * Called every frame — checks proximity and populates new clusters
   */
  update(camX, camY, camZ) {
    for (const cluster of this.clusters) {
      if (this.populatedClusters.has(cluster.id)) continue;

      const dx = camX - cluster.position.x;
      const dy = camY - cluster.position.y;
      const dz = camZ - cluster.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < cluster.spawnRadius) {
        this.populatedClusters.add(cluster.id);
        this._populateCluster(cluster);
      }
    }
  }

  /**
   * Spawns all tools for a cluster in a spherical distribution
   */
  _populateCluster(cluster) {
    const tools = this._getToolsForCluster(cluster);
    const count = tools.length;

    tools.forEach((tool, i) => {
      // Stagger spawn animations for a wave-ripple feel
      const delay = i * 0.04;

      setTimeout(() => {
        const { x, y, z } = this._sphericalPosition(cluster, i, count);
        this.cardManager.spawnCard(tool, x, y, z, cluster.accent);
      }, delay * 1000);
    });
  }

  /**
   * Get tools for a cluster, including user-submitted ones
   */
  _getToolsForCluster(cluster) {
    const seed = this._toolsByCategory[cluster.category] || [];
    const user = this.userTools.filter(t => t.category === cluster.category);
    return [...seed, ...user];
  }

  /**
   * Uniform spherical volume distribution (cube-root for even density)
   */
  _sphericalPosition(cluster, index, total) {
    // Use golden angle for even distribution, with randomized radius
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const theta = index * goldenAngle;
    const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
    const r = cluster.radius * Math.cbrt(0.3 + Math.random() * 0.7);

    return {
      x: cluster.position.x + r * Math.sin(phi) * Math.cos(theta),
      y: cluster.position.y + r * Math.sin(phi) * Math.sin(theta),
      z: cluster.position.z + r * Math.cos(phi),
    };
  }

  /**
   * Add a user-submitted tool and spawn it near the camera
   */
  addUserTool(toolData, camX, camY, camZ) {
    const tool = {
      ...toolData,
      id: `user-${Date.now()}`,
      type: 'tool',
      upvotes: 0,
    };

    this.userTools.push(tool);

    // Also inject into the category lookup for future cluster reloads
    if (!this._toolsByCategory[tool.category]) {
      this._toolsByCategory[tool.category] = [];
    }
    this._toolsByCategory[tool.category].push(tool);

    // Find the matching cluster accent
    const cluster = this.clusters.find(c => c.category === tool.category);
    const accent = cluster?.accent || null;

    // Spawn in front of camera with a fun arc
    const offsetTheta = Math.random() * Math.PI * 2;
    const x = camX + Math.cos(offsetTheta) * 3;
    const y = camY + Math.sin(offsetTheta) * 3;
    const z = camZ - 20;

    return this.cardManager.spawnCard(tool, x, y, z, accent);
  }

  /**
   * Returns cluster screen-space data for label overlay
   * Call this each frame from the animation loop
   */
  getClusterScreenData(camera) {
    return this.clusters.map(cluster => {
      const pos = new THREE.Vector3(
        cluster.position.x,
        cluster.position.y,
        cluster.position.z
      );

      // Distance from camera
      const camPos = camera.position;
      const dx = camPos.x - pos.x;
      const dy = camPos.y - pos.y;
      const dz = camPos.z - pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Project to screen
      const projected = pos.clone().project(camera);
      const screenX = (projected.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-projected.y * 0.5 + 0.5) * window.innerHeight;

      // Behind camera check
      const isBehind = projected.z > 1;

      // Visibility: show label when > 200 units away, fade by distance
      const minDist = 200;
      const maxDist = 800;
      const opacity = isBehind ? 0 : Math.min(1, Math.max(0,
        (dist - minDist) / (maxDist - minDist)
      ));

      return {
        id: cluster.id,
        name: cluster.name,
        accent: cluster.accent,
        screenX,
        screenY,
        dist,
        opacity,
        isPopulated: this.populatedClusters.has(cluster.id),
        toolCount: (this._toolsByCategory[cluster.category] || []).length,
        position: cluster.position,
      };
    });
  }
}
