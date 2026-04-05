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

function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function buildLightningBoltSegments(start, end, random = Math.random) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy) || 1;
  const normalX = -dy / distance;
  const normalY = dx / distance;
  const segmentCount = Math.max(5, Math.min(8, Math.round(distance / 24)));
  const jitter = Math.min(18, distance * 0.18);
  const mainPoints = [start];

  for (let index = 1; index < segmentCount; index += 1) {
    const t = index / segmentCount;
    const taper = Math.sin(Math.PI * t);
    const offset = (random() * 2 - 1) * jitter * taper;

    mainPoints.push({
      x: lerp(start.x, end.x, t) + normalX * offset,
      y: lerp(start.y, end.y, t) + normalY * offset
    });
  }

  mainPoints.push(end);

  const branchCount = Math.max(1, Math.min(3, Math.floor(segmentCount / 2)));
  const branches = [];

  for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
    const anchorIndex = Math.min(
      mainPoints.length - 2,
      1 + Math.floor(random() * Math.max(1, mainPoints.length - 2))
    );
    const anchor = mainPoints[anchorIndex];
    const length = 12 + random() * Math.min(26, distance * 0.25);
    const directionSign = random() > 0.5 ? 1 : -1;
    const bend = (random() * 2 - 1) * length * 0.2;

    branches.push([
      anchor,
      {
        x: anchor.x + normalX * directionSign * length * 0.55 + (dx / distance) * bend,
        y: anchor.y + normalY * directionSign * length * 0.55 + (dy / distance) * bend
      },
      {
        x: anchor.x + normalX * directionSign * length + (dx / distance) * bend * 0.45,
        y: anchor.y + normalY * directionSign * length + (dy / distance) * bend * 0.45
      }
    ]);
  }

  return {
    branches,
    mainPoints
  };
}
