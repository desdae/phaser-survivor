import { getNearestEnemy } from './combat.js';

function getEnemyKey(enemy) {
  return enemy?.id ?? enemy;
}

export function getChainTargets(origin, enemies, maxHits, chainRange) {
  if (maxHits <= 0) {
    return [];
  }

  const firstTarget = getNearestEnemy(origin, enemies);

  if (!firstTarget) {
    return [];
  }

  const targets = [firstTarget];
  const seen = new Set([getEnemyKey(firstTarget)]);
  let currentOrigin = firstTarget;
  const maxDistanceSq = chainRange * chainRange;

  while (targets.length < maxHits) {
    let nextTarget = null;
    let nextDistanceSq = maxDistanceSq;

    for (const enemy of enemies) {
      if (!enemy?.active || seen.has(getEnemyKey(enemy))) {
        continue;
      }

      const dx = enemy.x - currentOrigin.x;
      const dy = enemy.y - currentOrigin.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq <= nextDistanceSq) {
        nextDistanceSq = distanceSq;
        nextTarget = enemy;
      }
    }

    if (!nextTarget) {
      break;
    }

    targets.push(nextTarget);
    seen.add(getEnemyKey(nextTarget));
    currentOrigin = nextTarget;
  }

  return targets;
}
