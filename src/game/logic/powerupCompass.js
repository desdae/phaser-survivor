export const POWERUP_COMPASS_EDGE_INSET = 36;

export function getPowerupCompassState(
  pickup,
  camera,
  viewportWidth,
  viewportHeight,
  edgeInset = POWERUP_COMPASS_EDGE_INSET
) {
  if (!pickup?.active || !camera || !viewportWidth || !viewportHeight) {
    return null;
  }

  const localX = pickup.x - camera.scrollX;
  const localY = pickup.y - camera.scrollY;

  if (localX >= 0 && localX <= viewportWidth && localY >= 0 && localY <= viewportHeight) {
    return null;
  }

  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const dx = localX - centerX;
  const dy = localY - centerY;
  const safeDx = dx === 0 ? 0.0001 : dx;
  const safeDy = dy === 0 ? 0.0001 : dy;
  const halfWidth = viewportWidth / 2 - edgeInset;
  const halfHeight = viewportHeight / 2 - edgeInset;
  const scale = Math.min(Math.abs(halfWidth / safeDx), Math.abs(halfHeight / safeDy));

  return {
    angle: Math.atan2(dy, dx),
    x: centerX + dx * scale,
    y: centerY + dy * scale
  };
}
