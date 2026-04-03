export function getNearestEnemy(origin, enemies) {
  let nearestEnemy = null;
  let nearestDistanceSq = Number.POSITIVE_INFINITY;

  for (const enemy of enemies) {
    if (!enemy?.active) {
      continue;
    }

    const dx = enemy.x - origin.x;
    const dy = enemy.y - origin.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq;
      nearestEnemy = enemy;
    }
  }

  return nearestEnemy;
}

export function getProjectileVelocity(origin, target, speed) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const length = Math.hypot(dx, dy) || 1;

  return {
    x: (dx / length) * speed,
    y: (dy / length) * speed
  };
}

function getEnemyKey(enemy) {
  return enemy?.id ?? enemy;
}

export function registerProjectileHit(projectile, enemy) {
  if (!projectile.hitEnemyKeys) {
    projectile.hitEnemyKeys = new Set();
  }

  const key = getEnemyKey(enemy);

  if (projectile.hitEnemyKeys.has(key)) {
    return false;
  }

  projectile.hitEnemyKeys.add(key);
  return true;
}

export function getShotDirections(baseDirection, projectileCount, spreadDeg) {
  if (projectileCount <= 1) {
    return [baseDirection];
  }

  const angleStep = (spreadDeg * Math.PI) / 180;
  const start = -((projectileCount - 1) / 2) * angleStep;

  return Array.from({ length: projectileCount }, (_, index) => {
    const angle = start + index * angleStep;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = baseDirection.x * cos - baseDirection.y * sin;
    const y = baseDirection.x * sin + baseDirection.y * cos;
    const length = Math.hypot(x, y) || 1;

    return { x: x / length, y: y / length };
  });
}

export function getRicochetTarget(hitEnemy, enemies, maxDistance, excludedEnemyKeys = null) {
  let best = null;
  let bestDistanceSq = maxDistance * maxDistance;

  for (const enemy of enemies) {
    if (!enemy?.active || enemy === hitEnemy) {
      continue;
    }

    const enemyKey = getEnemyKey(enemy);

    if (excludedEnemyKeys?.has?.(enemyKey)) {
      continue;
    }

    const dx = enemy.x - hitEnemy.x;
    const dy = enemy.y - hitEnemy.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq <= bestDistanceSq) {
      bestDistanceSq = distanceSq;
      best = enemy;
    }
  }

  return best;
}
