export function getMeteorTargets(origin, enemies, strikeCount) {
  return enemies
    .filter((enemy) => enemy?.active)
    .map((enemy) => ({
      distanceSq: (enemy.x - origin.x) * (enemy.x - origin.x) + (enemy.y - origin.y) * (enemy.y - origin.y),
      enemy
    }))
    .sort((left, right) => left.distanceSq - right.distanceSq)
    .slice(0, strikeCount)
    .map((entry) => entry.enemy);
}

export function resolveMeteorStrike(strike, enemies, enemyManager) {
  const radiusSq = strike.radius * strike.radius;

  enemies.forEach((enemy) => {
    if (!enemy?.active) {
      return;
    }

    const dx = enemy.x - strike.x;
    const dy = enemy.y - strike.y;

    if (dx * dx + dy * dy <= radiusSq) {
      enemyManager.damageEnemy(enemy, strike.damage);
    }
  });
}
