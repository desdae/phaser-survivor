export function getNovaTargets(origin, enemies, radius) {
  const radiusSq = radius * radius;

  return enemies.filter((enemy) => {
    if (!enemy?.active) {
      return false;
    }

    const dx = enemy.x - origin.x;
    const dy = enemy.y - origin.y;
    return dx * dx + dy * dy <= radiusSq;
  });
}

export function queueNovaBursts(startAt, burstCount, intervalMs) {
  return Array.from({ length: Math.max(0, burstCount) }, (_, index) => startAt + index * intervalMs);
}
