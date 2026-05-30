import { CATEGORIES } from '../data/seedTools';

// 6 spherical cluster zones scattered in all directions
export const clusters = [
  {
    id: 'ai-tools',
    name: 'AI Tools',
    category: CATEGORIES.AI.id,
    accent: CATEGORIES.AI,
    position: { x: 0, y: 0, z: 0 },         // Home — where you start
    radius: 130,
    spawnRadius: 350,                          // Populate when within this distance
  },
  {
    id: 'design-tools',
    name: 'Design Tools',
    category: CATEGORIES.DESIGN.id,
    accent: CATEGORIES.DESIGN,
    position: { x: 420, y: -40, z: -180 },   // Right + slightly forward
    radius: 120,
    spawnRadius: 330,
  },
  {
    id: 'dev-tools',
    name: 'Dev Tools',
    category: CATEGORIES.DEV.id,
    accent: CATEGORIES.DEV,
    position: { x: -380, y: 60, z: -280 },   // Left + deeper
    radius: 125,
    spawnRadius: 340,
  },
  {
    id: 'productivity',
    name: 'Productivity',
    category: CATEGORIES.PRODUCTIVITY.id,
    accent: CATEGORIES.PRODUCTIVITY,
    position: { x: 140, y: -260, z: -460 },  // Down + far
    radius: 110,
    spawnRadius: 320,
  },
  {
    id: 'resources',
    name: 'Resources',
    category: CATEGORIES.RESOURCES.id,
    accent: CATEGORIES.RESOURCES,
    position: { x: -460, y: 140, z: 180 },   // Far left + up + near
    radius: 115,
    spawnRadius: 330,
  },
  {
    id: 'creative',
    name: 'Creative',
    category: CATEGORIES.CREATIVE.id,
    accent: CATEGORIES.CREATIVE,
    position: { x: 160, y: 320, z: -620 },   // Up + very far
    radius: 120,
    spawnRadius: 340,
  },
];
