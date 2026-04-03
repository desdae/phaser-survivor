import { getShotDirections } from './combat.js';

function getEnemyKey(enemy) {
  return enemy?.id ?? enemy;
}

export function createBoomerangDirections(baseDirection, boomerangCount, spreadDeg) {
  return getShotDirections(baseDirection, boomerangCount, spreadDeg);
}

export function advanceBoomerang(boomerang, playerPosition, deltaMs) {
  const deltaSeconds = deltaMs / 1000;

  if (!boomerang.returning) {
    boomerang.x += boomerang.directionX * boomerang.speed * deltaSeconds;
    boomerang.y += boomerang.directionY * boomerang.speed * deltaSeconds;
    boomerang.traveled += boomerang.speed * deltaSeconds;

    if (boomerang.traveled >= boomerang.maxDistance) {
      boomerang.returning = true;
    }

    return false;
  }

  const dx = playerPosition.x - boomerang.x;
  const dy = playerPosition.y - boomerang.y;
  const distance = Math.hypot(dx, dy) || 1;
  const returnSpeed = boomerang.speed * 1.1;
  const travelStep = returnSpeed * deltaSeconds;

  if (distance <= travelStep + 10) {
    boomerang.x = playerPosition.x;
    boomerang.y = playerPosition.y;
    return true;
  }

  boomerang.x += (dx / distance) * travelStep;
  boomerang.y += (dy / distance) * travelStep;
  return false;
}

export function registerBoomerangHit(boomerang, enemy) {
  if (!boomerang.hitEnemyKeys) {
    boomerang.hitEnemyKeys = new Set();
  }

  const key = getEnemyKey(enemy);

  if (boomerang.hitEnemyKeys.has(key)) {
    return false;
  }

  boomerang.hitEnemyKeys.add(key);
  return true;
}
