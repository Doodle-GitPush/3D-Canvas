import { UnsplashService } from './UnsplashService';
import { PexelsService } from './PexelsService';

/**
 * DesignFeed — blends Unsplash + Pexels into one infinite shuffled queue.
 * Pre-fetches ahead so the canvas never stalls waiting for network.
 */
export class DesignFeed {
  constructor({ unsplashKey, pexelsKey }) {
    this.pool = [];         // Ready-to-consume items
    this.isFetching = false;
    this.MIN_POOL = 50;     // Start pre-fetching when pool drops below this

    this.unsplash = unsplashKey ? new UnsplashService(unsplashKey) : null;
    this.pexels = pexelsKey ? new PexelsService(pexelsKey) : null;

    this.hasUnsplash = !!this.unsplash;
    this.hasPexels = !!this.pexels;

    // Kick off initial fetch immediately
    this._prefetch();
  }

  /**
   * Returns the next item from the pool.
   * Triggers a background prefetch if pool is running low.
   * @returns {Object|null}
   */
  getNext() {
    if (this.pool.length < this.MIN_POOL && !this.isFetching) {
      this._prefetch();
    }

    if (this.pool.length === 0) return null;
    return this.pool.shift();
  }

  /**
   * Returns the next item whose query matches one of the provided hints.
   * Falls back to getNext() if no match is found in the pool.
   * @param {string[]} queries
   * @returns {Object|null}
   */
  getNextByQueryHint(queries) {
    if (!queries || queries.length === 0) return this.getNext();

    if (this.pool.length < this.MIN_POOL && !this.isFetching) {
      this._prefetch();
    }

    for (let i = 0; i < this.pool.length; i++) {
      if (queries.includes(this.pool[i].query)) {
        return this.pool.splice(i, 1)[0];
      }
    }

    return this.getNext();
  }

  /**
   * Returns true if any API is configured
   */
  get isReady() {
    return this.hasUnsplash || this.hasPexels;
  }

  /**
   * Fetches a new batch from both APIs, shuffles, and appends to pool
   */
  async _prefetch() {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const fetches = [];

      if (this.hasUnsplash) {
        fetches.push(this.unsplash.fetchBatch(30).catch(() => []));
      }
      if (this.hasPexels) {
        fetches.push(this.pexels.fetchBatch(30).catch(() => []));
      }

      if (fetches.length === 0) {
        this.isFetching = false;
        return;
      }

      const results = await Promise.all(fetches);
      const combined = results.flat();

      // Fisher-Yates shuffle so Unsplash and Pexels cards are interleaved randomly
      for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
      }

      this.pool.push(...combined);
    } finally {
      this.isFetching = false;

      // If pool still empty after fetch (both APIs failed), queue retry
      if (this.pool.length === 0) {
        setTimeout(() => this._prefetch(), 5000);
      }
    }
  }

  /**
   * Update API keys at runtime (e.g., after user enters them in setup screen)
   */
  updateKeys({ unsplashKey, pexelsKey }) {
    if (unsplashKey) {
      this.unsplash = new UnsplashService(unsplashKey);
      this.hasUnsplash = true;
    }
    if (pexelsKey) {
      this.pexels = new PexelsService(pexelsKey);
      this.hasPexels = true;
    }
    this.pool = [];
    this._prefetch();
  }
}
