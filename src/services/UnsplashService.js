const DESIGN_QUERIES = [
  'UI design',
  'web design',
  'logo design',
  'branding identity',
  'mobile app design',
  'typography poster',
  'graphic design',
  'product design',
  'minimal design',
  'interface design',
  'visual identity',
  'packaging design',
];

export class UnsplashService {
  constructor(accessKey) {
    this.accessKey = accessKey;
    this.baseUrl = 'https://api.unsplash.com';
    this.queryIndex = 0;
    this.pageMap = {}; // query → current page number
    this.exhausted = new Set();
  }

  /**
   * Fetch next batch of design photos
   * @returns {Promise<Array>} normalized items
   */
  async fetchBatch(count = 30) {
    if (this.exhausted.size >= DESIGN_QUERIES.length) {
      // All queries exhausted — reset and cycle again
      this.exhausted.clear();
      this.pageMap = {};
    }

    // Find next non-exhausted query
    let query = null;
    for (let i = 0; i < DESIGN_QUERIES.length; i++) {
      const candidate = DESIGN_QUERIES[(this.queryIndex + i) % DESIGN_QUERIES.length];
      if (!this.exhausted.has(candidate)) {
        query = candidate;
        this.queryIndex = (this.queryIndex + i + 1) % DESIGN_QUERIES.length;
        break;
      }
    }

    if (!query) return [];

    const page = this.pageMap[query] || 1;
    const perPage = Math.min(count, 30);

    try {
      const res = await fetch(
        `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape&content_filter=high`,
        {
          headers: {
            Authorization: `Client-ID ${this.accessKey}`,
          },
        }
      );

      if (res.status === 401 || res.status === 403) {
        console.warn('[Unsplash] Invalid API key');
        return [];
      }

      if (!res.ok) throw new Error(`Unsplash ${res.status}`);

      const json = await res.json();
      const results = json.results || [];

      if (results.length === 0 || page >= json.total_pages) {
        this.exhausted.add(query);
      } else {
        this.pageMap[query] = page + 1;
      }

      return results.map((photo) => ({
        id: `unsplash-${photo.id}`,
        imageUrl: photo.urls.regular,
        thumbUrl: photo.urls.small,
        title: photo.alt_description || photo.description || query,
        author: photo.user?.name || 'Unknown',
        authorUrl: photo.user?.links?.html,
        likes: photo.likes || 0,
        source: 'unsplash',
        sourceUrl: photo.links?.html,
        color: photo.color || '#f4f4f5',
        query,
        type: 'api-image',
      }));
    } catch (err) {
      console.warn('[Unsplash] Fetch error:', err);
      return [];
    }
  }
}
