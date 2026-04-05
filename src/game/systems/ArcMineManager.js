function getDistanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function getNearestEnemyInRange(origin, enemies, maxDistance, excludedIds = new Set()) {
  const maxDistanceSq = maxDistance * maxDistance;
  let best = null;
  let bestDistanceSq = maxDistanceSq;

  for (const enemy of enemies ?? []) {
    if (!enemy?.active || excludedIds.has(enemy.id)) {
      continue;
    }

    const distanceSq = getDistanceSq(origin, enemy);

    if (distanceSq <= bestDistanceSq) {
      best = enemy;
      bestDistanceSq = distanceSq;
    }
  }

  return best;
}

export class ArcMineManager {
  constructor(scene = null) {
    this.scene = scene;
    this.nextCastAt = 0;
  }

  update(player, stats, cursorWorld, now, enemies, enemyManager) {
    if (!stats.arcMineUnlocked || now < this.nextCastAt) {
      return false;
    }

    const liveEnemies = enemies?.enemies ?? enemies ?? [];
    const hitIds = new Set();
    let current = getNearestEnemyInRange(cursorWorld, liveEnemies, stats.arcMineTriggerRadius ?? 0, hitIds);

    if (!current) {
      return false;
    }

    let jumpsRemaining = Math.max(1, stats.arcMineChains ?? 1);
    this.nextCastAt = now + (stats.arcMineCooldownMs ?? 0);

    while (current && jumpsRemaining > 0) {
      hitIds.add(current.id);
      enemyManager.damageEnemy(current, stats.arcMineDamage, 'arcMine');
      jumpsRemaining -= 1;
      current = getNearestEnemyInRange(
        current,
        liveEnemies,
        stats.arcMineChainRange ?? 0,
        hitIds
      );
    }

    return true;
  }
}
