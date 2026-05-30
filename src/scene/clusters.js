import { CATEGORIES } from '../data/seedTools';

// 6 cluster zones — tight enough that cards from adjacent clusters are visible simultaneously
export const clusters = [
  {
    id: 'ai-tools',
    name: 'AI Tools',
    category: CATEGORIES.AI.id,
    accent: CATEGORIES.AI,
    position: { x: 0, y: 0, z: 0 },
    radius: 160,
    spawnRadius: 999, // always populate
  },
  {
    id: 'design-tools',
    name: 'Design Tools',
    category: CATEGORIES.DESIGN.id,
    accent: CATEGORIES.DESIGN,
    position: { x: 260, y: -30, z: -80 },
    radius: 150,
    spawnRadius: 999,
  },
  {
    id: 'dev-tools',
    name: 'Dev Tools',
    category: CATEGORIES.DEV.id,
    accent: CATEGORIES.DEV,
    position: { x: -240, y: 40, z: -100 },
    radius: 155,
    spawnRadius: 999,
  },
  {
    id: 'productivity',
    name: 'Productivity',
    category: CATEGORIES.PRODUCTIVITY.id,
    accent: CATEGORIES.PRODUCTIVITY,
    position: { x: 80, y: -220, z: -180 },
    radius: 145,
    spawnRadius: 999,
  },
  {
    id: 'resources',
    name: 'Resources',
    category: CATEGORIES.RESOURCES.id,
    accent: CATEGORIES.RESOURCES,
    position: { x: -200, y: 180, z: 80 },
    radius: 145,
    spawnRadius: 999,
  },
  {
    id: 'creative',
    name: 'Creative',
    category: CATEGORIES.CREATIVE.id,
    accent: CATEGORIES.CREATIVE,
    position: { x: 120, y: 200, z: -280 },
    radius: 150,
    spawnRadius: 999,
  },
];
