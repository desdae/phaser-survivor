export function getEnemyIntent(enemy, enemyPosition, playerPosition) {
  const dx = playerPosition.x - enemyPosition.x;
  const dy = playerPosition.y - enemyPosition.y;
  const distance = Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;

  if (enemy.type !== 'spitter') {
    return { moveX: nx, moveY: ny, wantsToShoot: false };
  }

  const preferredRange = enemy.preferredRange ?? 240;
  const tolerance = 28;

  if (distance < preferredRange - tolerance) {
    return { moveX: -nx, moveY: -ny, wantsToShoot: false };
  }

  if (distance > preferredRange + tolerance) {
    return { moveX: nx, moveY: ny, wantsToShoot: false };
  }

  return { moveX: 0, moveY: 0, wantsToShoot: true };
}

export function shouldEnemyShoot(enemy, now, distanceToPlayer) {
  return enemy.type === 'spitter' && distanceToPlayer <= (enemy.attackRange ?? 320) && now >= enemy.nextShotAt;
}
