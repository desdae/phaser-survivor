export const NEAR_DISTANCE = 420;
export const MID_DISTANCE = 960;
export const NEAR_DISTANCE_SQ = NEAR_DISTANCE * NEAR_DISTANCE;
export const MID_DISTANCE_SQ = MID_DISTANCE * MID_DISTANCE;
export const MID_UPDATE_INTERVAL = 3;
export const FAR_UPDATE_INTERVAL = 6;
export const ANIMATION_STEP_MS = 120;

export function classifyEnemyTier(enemy, playerPosition) {
  const dx = enemy.x - playerPosition.x;
  const dy = enemy.y - playerPosition.y;
  const distanceSq = dx * dx + dy * dy;

  if (distanceSq <= NEAR_DISTANCE_SQ) {
    return 'near';
  }

  if (distanceSq <= MID_DISTANCE_SQ) {
    return 'mid';
  }

  return 'far';
}

export function shouldRefreshEnemyLogic(tier, frameIndex) {
  if (tier === 'near') {
    return true;
  }

  if (tier === 'mid') {
    return frameIndex % MID_UPDATE_INTERVAL === 0;
  }

  return frameIndex % FAR_UPDATE_INTERVAL === 0;
}

export function shouldAdvanceAnimation(now, nextAnimationAt) {
  return now - nextAnimationAt >= ANIMATION_STEP_MS;
}
