import * as THREE from 'three';
import { Card } from './Card';
import { gsap } from 'gsap';
import { CLUSTERS } from './ClusterConfig';

export class CardManager {
  /**
   * @param {THREE.Scene} scene - Parent WebGL scene
   * @param {import('../services/DesignFeed').DesignFeed} designFeed - Live design feed
   */
  constructor(scene, designFeed) {
    this.scene = scene;
    this.designFeed = designFeed;

    this.cards = [];
    this.spawnedCount = 0;

    // Pending async spawns queue — prevents scene stalls
    this.pendingSpawns = [];

    // Infinite Procedural Chunk Spawning State
    this.chunkSize = 50;
    this.populatedChunks = new Set();
  }

  /**
   * Tracks camera position and dynamically populates 3D space chunks around it
   */
  updateChunks(cameraX, cameraY, cameraZ) {
    const camCx = Math.floor(cameraX / this.chunkSize);
    const camCy = Math.floor(cameraY / this.chunkSize);
    const camCz = Math.floor(cameraZ / this.chunkSize);

    // 5x5x5 grid of chunks around camera
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          const cx = camCx + dx;
          const cy = camCy + dy;
          const cz = camCz + dz;
          const chunkKey = `${cx},${cy},${cz}`;

          if (!this.populatedChunks.has(chunkKey)) {
            this.populatedChunks.add(chunkKey);
            this.spawnNodesInChunk(cx, cy, cz);
          }
        }
      }
    }

    // Flush any pending spawn tasks
    this._flushPendingSpawns();
  }

  /**
   * Spawns scattered nodes inside a chunk, pulling from the live DesignFeed
   */
  spawnNodesInChunk(cx, cy, cz) {
    const nodesCount = 6 + Math.floor(Math.random() * 5);

    for (let i = 0; i < nodesCount; i++) {
      const x = cx * this.chunkSize + Math.random() * this.chunkSize;
      const y = cy * this.chunkSize + Math.random() * this.chunkSize;
      const z = cz * this.chunkSize + Math.random() * this.chunkSize;

      // Grab the next item, biased toward this cluster's query themes if inside one
      const cluster = this._nearestCluster(x, y, z);
      const data = this.designFeed
        ? (cluster
          ? this.designFeed.getNextByQueryHint(cluster.queries)
          : this.designFeed.getNext())
        : null;

      if (data) {
        this._spawnCard(data, x, y, z);
      } else {
        // Pool is empty — queue spawn for when feed has data
        this.pendingSpawns.push({ x, y, z });
      }
    }
  }

  /**
   * Processes deferred spawns once the feed pool refills
   */
  _flushPendingSpawns() {
    if (!this.pendingSpawns.length || !this.designFeed) return;

    const toProcess = [...this.pendingSpawns];
    this.pendingSpawns = [];

    for (const { x, y, z } of toProcess) {
      const data = this.designFeed.getNext();
      if (data) {
        this._spawnCard(data, x, y, z);
      } else {
        // Still empty — re-queue for later
        this.pendingSpawns.push({ x, y, z });
        break;
      }
    }
  }

  /**
   * Creates and animates a card into the scene at the given position
   */
  _spawnCard(data, x, y, z) {
    const card = new Card(data, this.scene);

    card.meshGroup.position.set(x, y, z);
    card.meshGroup.rotation.set(0, 0, 0);
    card.meshGroup.scale.set(0.01, 0.01, 0.01);

    this.cards.push(card);
    this.spawnedCount++;

    gsap.to(card.meshGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 1.0,
      ease: 'power3.out',
    });
  }

  /**
   * Cleans up cards too far from camera to conserve memory
   */
  cleanupFarNodes(cameraX, cameraY, cameraZ) {
    const camPos = new THREE.Vector3(cameraX, cameraY, cameraZ);
    const maxDistance = 350;

    for (let i = this.cards.length - 1; i >= 0; i--) {
      const card = this.cards[i];
      const distance = card.meshGroup.position.distanceTo(camPos);

      if (distance > maxDistance) {
        const cx = Math.floor(card.meshGroup.position.x / this.chunkSize);
        const cy = Math.floor(card.meshGroup.position.y / this.chunkSize);
        const cz = Math.floor(card.meshGroup.position.z / this.chunkSize);
        this.populatedChunks.delete(`${cx},${cy},${cz}`);

        card.destroy();
        this.cards.splice(i, 1);
      }
    }
  }

  /**
   * Spawns a user-added inspiration card directly in front of the camera
   */
  addNewInspiration(itemData, cameraX, cameraY, cameraZ) {
    const newItem = {
      ...itemData,
      author: 'You',
      date: 'Just Now',
      likes: 0,
      type: itemData.type || 'text',
    };

    const offsetTheta = Math.random() * Math.PI * 2;
    const offsetR = 2.5;
    const x = cameraX + Math.cos(offsetTheta) * offsetR;
    const y = cameraY + Math.sin(offsetTheta) * offsetR;
    const z = cameraZ - 18;

    const card = new Card(newItem, this.scene);
    card.meshGroup.position.set(x, y, z);
    card.meshGroup.rotation.set(0, 0, 0);
    card.meshGroup.scale.set(0.01, 0.01, 0.01);
    card.meshGroup.position.y += 10;

    this.cards.push(card);

    gsap.to(card.meshGroup.position, { y, duration: 1.2, ease: 'bounce.out' });
    gsap.to(card.meshGroup.scale, { x: 1, y: 1, z: 1, duration: 1.0, ease: 'power3.out' });

    return card;
  }

  /**
   * Returns the cluster whose boundary contains (x, y, z), or null.
   */
  _nearestCluster(x, y, z) {
    for (const cluster of CLUSTERS) {
      const dx = x - cluster.x;
      const dy = y - cluster.y;
      const dz = z - cluster.z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) <= cluster.radius) {
        return cluster;
      }
    }
    return null;
  }

  update(time) {
    for (let i = 0; i < this.cards.length; i++) {
      this.cards[i].update(time);
    }
  }
}
