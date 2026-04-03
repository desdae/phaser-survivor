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
