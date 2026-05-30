// Six named design-area clusters spread across the XY plane.
// Cards spawned within a cluster's radius are biased toward its queries.
// Rings and labels fade in when camera Z exceeds CLUSTER_ZOOM_THRESHOLD.

export const CLUSTERS = [
  {
    id: 'brutalism',
    label: 'Brutalism',
    sublabel: 'Raw Form & Material',
    x: -175, y: 55, z: 0,
    radius: 95,
    queries: ['graphic design', 'minimal design'],
  },
  {
    id: 'minimalism',
    label: 'Minimalism',
    sublabel: 'White Space & Clarity',
    x: 175, y: -55, z: 0,
    radius: 95,
    queries: ['minimal design', 'web design'],
  },
  {
    id: 'typography',
    label: 'Typography',
    sublabel: 'Type & Lettering',
    x: 10, y: -190, z: 0,
    radius: 90,
    queries: ['typography poster', 'graphic design'],
  },
  {
    id: 'architecture',
    label: 'Architecture',
    sublabel: 'Space & Structure',
    x: -160, y: -165, z: 0,
    radius: 90,
    queries: ['product design', 'packaging design'],
  },
  {
    id: 'interface',
    label: 'Interface',
    sublabel: 'UI & Product',
    x: 170, y: 165, z: 0,
    radius: 95,
    queries: ['UI design', 'interface design', 'mobile app design'],
  },
  {
    id: 'identity',
    label: 'Visual Identity',
    sublabel: 'Brand & Logo',
    x: 10, y: 190, z: 0,
    radius: 90,
    queries: ['visual identity', 'logo design', 'branding identity'],
  },
];

// Camera Z value at which cluster rings and labels begin to appear
export const CLUSTER_ZOOM_THRESHOLD = 105;

// Camera Z value at which cluster rings and labels are fully opaque
export const CLUSTER_ZOOM_FULL = 170;
