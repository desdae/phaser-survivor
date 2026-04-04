import { getNearbyEnemies } from './combat.js';

export function getNovaTargets(origin, enemies, radius) {
  return getNearbyEnemies(origin, enemies, radius);
}

export function queueNovaBursts(startAt, burstCount, intervalMs) {
  return Array.from({ length: Math.max(0, burstCount) }, (_, index) => startAt + index * intervalMs);
}
