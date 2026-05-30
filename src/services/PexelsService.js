const DESIGN_QUERIES = [
  'UI design',
  'web design',
  'logo branding',
  'graphic design',
  'typography',
  'mobile app',
  'product design',
  'minimal design',
  'poster design',
  'visual identity',
  'interface mockup',
  'packaging design',
];

export class PexelsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.pexels.com/v1';
    this.queryIndex = 0;
    this.pageMap = {};
    this.exhausted = new Set();
  }

  /**
   * Fetch next batch of design photos from Pexels
   * @returns {Promise<Array>} normalized items
   */
  async fetchBatch(count = 30) {
    if (this.exhausted.size >= DESIGN_QUERIES.length) {
      this.exhausted.clear();
      this.pageMap = {};
    }

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
    const perPage = Math.min(count, 80);

    try {
      const res = await fetch(
        `${this.baseUrl}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape`,
        {
          headers: {
            Authorization: this.apiKey,
          },
        }
      );

      if (res.status === 401 || res.status === 403) {
        console.warn('[Pexels] Invalid API key');
        return [];
      }

      if (!res.ok) throw new Error(`Pexels ${res.status}`);

      const json = await res.json();
      const photos = json.photos || [];

      const totalPages = Math.ceil(json.total_results / perPage);
      if (photos.length === 0 || page >= totalPages) {
        this.exhausted.add(query);
      } else {
        this.pageMap[query] = page + 1;
      }

      return photos.map((photo) => ({
        id: `pexels-${photo.id}`,
        imageUrl: photo.src.large2x || photo.src.large,
        thumbUrl: photo.src.medium,
        title: photo.alt || query,
        author: photo.photographer || 'Unknown',
        authorUrl: photo.photographer_url,
        likes: 0, // Pexels doesn't expose like counts
        source: 'pexels',
        sourceUrl: photo.url,
        color: photo.avg_color || '#f4f4f5',
        query,
        type: 'api-image',
      }));
    } catch (err) {
      console.warn('[Pexels] Fetch error:', err);
      return [];
    }
  }
}
