function getEnemyKey(enemy) {
  return enemy?.id ?? enemy;
}

function getEnemyTier(enemy) {
  return enemy?.lodTier === 'mid' || enemy?.lodTier === 'far' ? enemy.lodTier : 'near';
}

function isEnemyQuery(enemySource) {
  return Boolean(enemySource?.cellSize && enemySource?.cells && Array.isArray(enemySource?.enemies));
}

function getEnemyList(enemySource) {
  if (isEnemyQuery(enemySource)) {
    return enemySource.enemies;
  }

  return enemySource ?? [];
}

function getCellKey(cellX, cellY) {
  return `${cellX}:${cellY}`;
}

export function createEnemyQuery(enemies, cellSize = 96) {
  const cells = new Map();
  const enemiesByTier = {
    near: [],
    mid: [],
    far: []
  };
  const activeEnemies = [];

  for (const enemy of enemies ?? []) {
    if (!enemy?.active) {
      continue;
    }

    activeEnemies.push(enemy);
    enemiesByTier[getEnemyTier(enemy)].push(enemy);
    const cellX = Math.floor(enemy.x / cellSize);
    const cellY = Math.floor(enemy.y / cellSize);
    const key = getCellKey(cellX, cellY);

    if (!cells.has(key)) {
      cells.set(key, []);
    }

    cells.get(key).push(enemy);
  }

  return {
    cellSize,
    cells,
    enemies: activeEnemies,
    enemiesByTier
  };
}

export function getQueryEnemiesByTier(query, tier) {
  return query?.enemiesByTier?.[tier] ?? [];
}

export function getNearbyEnemies(
  origin,
  enemySource,
  maxDistance,
  limit = Number.POSITIVE_INFINITY,
  excludedEnemyKeys = null,
  allowedTiers = null
) {
  if (!origin || maxDistance <= 0) {
    return [];
  }

  const maxDistanceSq = maxDistance * maxDistance;
  const allowedTierSet = allowedTiers ? new Set(allowedTiers) : null;

  if (!isEnemyQuery(enemySource)) {
    const results = [];

    for (const enemy of getEnemyList(enemySource)) {
      if (!enemy?.active) {
        continue;
      }

      if (allowedTierSet && !allowedTierSet.has(getEnemyTier(enemy))) {
        continue;
      }

      const enemyKey = getEnemyKey(enemy);

      if (excludedEnemyKeys?.has?.(enemyKey)) {
        continue;
      }

      const dx = enemy.x - origin.x;
      const dy = enemy.y - origin.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq > maxDistanceSq) {
        continue;
      }

      results.push(enemy);

      if (results.length >= limit) {
        break;
      }
    }

    return results;
  }

  const { cellSize, cells } = enemySource;
  const minCellX = Math.floor((origin.x - maxDistance) / cellSize);
  const maxCellX = Math.floor((origin.x + maxDistance) / cellSize);
  const minCellY = Math.floor((origin.y - maxDistance) / cellSize);
  const maxCellY = Math.floor((origin.y + maxDistance) / cellSize);
  const results = [];

  for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      const bucket = cells.get(getCellKey(cellX, cellY));

      if (!bucket) {
        continue;
      }

      for (const enemy of bucket) {
        if (allowedTierSet && !allowedTierSet.has(getEnemyTier(enemy))) {
          continue;
        }

        const enemyKey = getEnemyKey(enemy);

        if (excludedEnemyKeys?.has?.(enemyKey)) {
          continue;
        }

        const dx = enemy.x - origin.x;
        const dy = enemy.y - origin.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq > maxDistanceSq) {
          continue;
        }

        results.push(enemy);

        if (results.length >= limit) {
          return results;
        }
      }
    }
  }

  return results;
}

export function getNearestEnemy(origin, enemySource) {
  let nearestEnemy = null;
  let nearestDistanceSq = Number.POSITIVE_INFINITY;

  for (const enemy of getEnemyList(enemySource)) {
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

  for (const enemy of getNearbyEnemies(hitEnemy, enemies, maxDistance, Number.POSITIVE_INFINITY, excludedEnemyKeys)) {
    if (enemy === hitEnemy) {
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
