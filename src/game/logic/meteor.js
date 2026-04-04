import { getNearbyEnemies } from './combat.js';

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
  getNearbyEnemies(strike, enemies, strike.radius).forEach((enemy) => {
    enemyManager.damageEnemy(enemy, strike.damage, 'meteor');
  });
}
