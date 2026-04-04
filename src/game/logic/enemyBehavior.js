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

export function getSpacingNeighbors(enemy, neighbors, spacingRadius = 42, maxNeighbors = 8) {
  const spacingRadiusSq = spacingRadius * spacingRadius;
  const spacingNeighbors = [];

  for (const neighbor of neighbors) {
    if (!neighbor?.active || neighbor === enemy) {
      continue;
    }

    const dx = enemy.x - neighbor.x;
    const dy = enemy.y - neighbor.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq === 0 || distanceSq >= spacingRadiusSq) {
      continue;
    }

    spacingNeighbors.push(neighbor);

    if (spacingNeighbors.length >= maxNeighbors) {
      break;
    }
  }

  return spacingNeighbors;
}

export function getSwarmSpacingOffset(enemy, neighbors, spacingRadius = 42, maxNeighbors = 8) {
  let offsetX = 0;
  let offsetY = 0;
  const spacingNeighbors = getSpacingNeighbors(enemy, neighbors, spacingRadius, maxNeighbors);
  const overlapRadius = 18;

  for (const neighbor of spacingNeighbors) {
    const dx = enemy.x - neighbor.x;
    const dy = enemy.y - neighbor.y;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq === 0) {
      continue;
    }

    const distance = Math.sqrt(distanceSq);
    const overlapBoost = distance < overlapRadius ? 1 + (overlapRadius - distance) / overlapRadius : 1;
    const pushWeight = ((spacingRadius - distance) / spacingRadius) * overlapBoost;
    offsetX += (dx / distance) * pushWeight;
    offsetY += (dy / distance) * pushWeight;
  }

  const length = Math.hypot(offsetX, offsetY) || 1;

  return {
    x: offsetX / length,
    y: offsetY / length
  };
}

export function applySwarmSpacing(baseIntent, enemy, neighbors, spacingWeight = 0.5) {
  const spacing = getSwarmSpacingOffset(enemy, neighbors);
  const moveX = baseIntent.moveX + spacing.x * spacingWeight;
  const moveY = baseIntent.moveY + spacing.y * spacingWeight;
  const length = Math.hypot(moveX, moveY);

  if (length === 0) {
    return baseIntent;
  }

  return {
    moveX: moveX / length,
    moveY: moveY / length,
    wantsToShoot: baseIntent.wantsToShoot
  };
}

export function shouldEnemyShoot(enemy, now, distanceToPlayer) {
  return enemy.type === 'spitter' && distanceToPlayer <= (enemy.attackRange ?? 320) && now >= enemy.nextShotAt;
}
