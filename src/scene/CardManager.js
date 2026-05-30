import * as THREE from 'three';
import { Card } from './Card';
import { gsap } from 'gsap';

/**
 * CardManager — thin registry.
 * ClusterManager drives all spawning logic.
 */
export class CardManager {
  constructor(scene) {
    this.scene = scene;
    this.cards = [];
  }

  /**
   * Creates a card and animates it into the scene
   * @param {Object} data - Tool data
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {Object|null} accent - Category accent colors
   * @returns {Card}
   */
  spawnCard(data, x, y, z, accent = null) {
    const card = new Card({ ...data, accent }, this.scene);
    card.meshGroup.position.set(x, y, z);
    card.meshGroup.scale.set(0.01, 0.01, 0.01);
    this.cards.push(card);

    gsap.to(card.meshGroup.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.9,
      ease: 'power3.out',
    });

    return card;
  }

  /**
   * Cleans up cards beyond cull distance
   */
  cleanupFarNodes(camX, camY, camZ) {
    const camPos = new THREE.Vector3(camX, camY, camZ);
    const maxDist = 700;

    for (let i = this.cards.length - 1; i >= 0; i--) {
      if (this.cards[i].meshGroup.position.distanceTo(camPos) > maxDist) {
        this.cards[i].destroy();
        this.cards.splice(i, 1);
      }
    }
  }

  update(time) {
    for (const card of this.cards) card.update(time);
  }
}
