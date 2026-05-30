import * as THREE from 'three';
import { CLUSTERS, CLUSTER_ZOOM_THRESHOLD, CLUSTER_ZOOM_FULL } from './ClusterConfig';

export class ClusterManager {
  constructor(scene) {
    this.scene = scene;
    this.rings = [];

    for (const cluster of CLUSTERS) {
      const line = this._buildRing(cluster);
      this.rings.push({ cluster, line });
    }
  }

  _buildRing(cluster) {
    const segments = 192;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        cluster.x + Math.cos(t) * cluster.radius,
        cluster.y + Math.sin(t) * cluster.radius,
        cluster.z,
      ));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({
      color: 0x09090b,
      transparent: true,
      opacity: 0,
      fog: false, // Stay visible even when zoomed far out
      dashSize: 6,
      gapSize: 3,
    });

    const line = new THREE.Line(geo, mat);
    line.computeLineDistances(); // Required by LineDashedMaterial
    this.scene.add(line);
    return line;
  }

  /**
   * Updates ring opacity and returns projected screen-space data for all clusters.
   * Call after renderer.render() so camera matrices are current.
   *
   * @returns {Array<{id, label, sublabel, x, y, opacity}>}
   */
  update(cameraZ, camera, screenW, screenH) {
    const t = Math.max(0, Math.min(1,
      (cameraZ - CLUSTER_ZOOM_THRESHOLD) / (CLUSTER_ZOOM_FULL - CLUSTER_ZOOM_THRESHOLD),
    ));

    return this.rings.map(({ cluster, line }) => {
      line.material.opacity = t * 0.45;

      let sx = 0, sy = 0, visible = false;

      if (t > 0) {
        const v = new THREE.Vector3(cluster.x, cluster.y, cluster.z);
        v.project(camera);

        if (v.z < 1) {
          sx = (v.x * 0.5 + 0.5) * screenW;
          sy = (-v.y * 0.5 + 0.5) * screenH;
          visible = true;
        }
      }

      return {
        id: cluster.id,
        label: cluster.label,
        sublabel: cluster.sublabel,
        x: sx,
        y: sy,
        opacity: visible ? t : 0,
      };
    });
  }

  destroy() {
    for (const { line } of this.rings) {
      line.geometry.dispose();
      line.material.dispose();
      this.scene.remove(line);
    }
    this.rings = [];
  }
}
