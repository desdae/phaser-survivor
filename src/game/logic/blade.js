export function getBladePositions(center, bladeCount, orbitRadius, rotationRad) {
  return Array.from({ length: bladeCount }, (_, index) => {
    const angle = rotationRad + (index / bladeCount) * Math.PI * 2;

    return {
      x: center.x + Math.cos(angle) * orbitRadius,
      y: center.y + Math.sin(angle) * orbitRadius
    };
  });
}

export function shouldBladeDamageEnemy(now, nextAllowedAt) {
  return now >= nextAllowedAt;
}
