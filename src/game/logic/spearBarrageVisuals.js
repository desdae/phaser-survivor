export const SPEAR_WARNING_MS = 220;

export function getSpearSpawnPosition(targetX, targetY, camera) {
  const startY = camera ? camera.scrollY - 140 : targetY - 280;
  const startX = camera ? targetX - camera.width * 0.18 : targetX - 144;

  return [Math.round(startX), Math.round(startY)];
}

export function getSpearFlightRotation(startX, startY, targetX, targetY) {
  return Math.atan2(targetY - startY, targetX - startX) + Math.PI / 2;
}

export function getSpearVisualState(strike, now) {
  const startAt = strike.landsAt - SPEAR_WARNING_MS;
  const progress = Math.max(0, Math.min(1, (now - startAt) / SPEAR_WARNING_MS));
  const lerp = (from, to) => from + (to - from) * progress;

  return {
    progress,
    x: Math.round(lerp(strike.spawnX, strike.x)),
    y: Math.round(lerp(strike.spawnY, strike.y)),
    scale: Number(lerp(1.18, 0.76).toFixed(2)),
    alpha: Number(lerp(0.88, 1).toFixed(2))
  };
}
