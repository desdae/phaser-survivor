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

function getEnemyList(enemySource) {
  return enemySource?.enemies ?? enemySource ?? [];
}

function getEnemyHitRadius(enemy) {
  return enemy?.hitRadius ?? enemy?.body?.radius ?? enemy?.body?.halfWidth ?? 0;
}

export function resolveMeteorStrike(strike, enemies, enemyManager) {
  getEnemyList(enemies)
    .filter((enemy) => enemy?.active)
    .forEach((enemy) => {
      const dx = enemy.x - strike.x;
      const dy = enemy.y - strike.y;
      const overlapRadius = strike.radius + getEnemyHitRadius(enemy);

      if (dx * dx + dy * dy > overlapRadius * overlapRadius) {
        return;
      }

      enemyManager.damageEnemy(enemy, strike.damage, 'meteor');
    });
}
