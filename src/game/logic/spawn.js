const SPAWN_SIDES = ['top', 'right', 'bottom', 'left'];

export function getSpawnPosition(
  view,
  margin,
  sideRng = Math.random,
  laneXRng = Math.random,
  laneYRng = Math.random
) {
  const side = SPAWN_SIDES[Math.floor(sideRng() * SPAWN_SIDES.length)];
  const x = view.left + laneXRng() * (view.right - view.left);
  const y = view.top + laneYRng() * (view.bottom - view.top);

  if (side === 'top') {
    return { x, y: view.top - margin };
  }

  if (side === 'right') {
    return { x: view.right + margin, y };
  }

  if (side === 'bottom') {
    return { x, y: view.bottom + margin };
  }

  return { x: view.left - margin, y };
}

export function getSpawnProfile(elapsedSeconds) {
  const earlyRampSeconds = Math.min(elapsedSeconds, 90);
  const lateRampSeconds = Math.max(0, elapsedSeconds - 90);
  const weights = {
    skeleton: elapsedSeconds < 35 ? 0.58 : 0.34,
    zombie: elapsedSeconds < 22 ? 0.18 : 0.26,
    bat: elapsedSeconds < 16 ? 0.12 : 0.24,
    tough: elapsedSeconds < 35 ? 0 : 0.28,
    spitter: elapsedSeconds < 55 ? 0 : Math.min(0.22, 0.06 + elapsedSeconds / 500),
    poisonBlob: elapsedSeconds < 80 ? 0 : Math.min(0.16, 0.03 + (elapsedSeconds - 80) / 420)
  };

  return {
    cooldownMs: Math.max(210, 960 - earlyRampSeconds * 3.5 - lateRampSeconds * 9),
    batchSize: Math.min(1 + Math.floor(earlyRampSeconds / 45) + Math.floor(lateRampSeconds / 20), 6),
    allowTough: elapsedSeconds >= 35,
    weights
  };
}
