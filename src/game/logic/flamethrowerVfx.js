export function buildFlameStreamPuffs(origin, aimDirection, config, rng = Math.random) {
  const perpendicular = { x: -aimDirection.y, y: aimDirection.x };

  const flames = Array.from({ length: config.flameCount }, (_, index) => {
    const progress = (index + 1) / config.flameCount;
    const distance = progress * config.maxDistance;
    const lateral = (rng() - 0.5) * config.spread;

    return {
      alpha: 0.95 - progress * 0.3,
      lifetimeMs: 90 + progress * 50,
      rotation: Math.atan2(aimDirection.y, aimDirection.x),
      scale: 0.55 + progress * 0.5,
      textureIndex: index % 3,
      x: origin.x + aimDirection.x * distance + perpendicular.x * lateral,
      y: origin.y + aimDirection.y * distance + perpendicular.y * lateral
    };
  });

  const smokes = Array.from({ length: config.smokeCount }, (_, index) => {
    const progress = (index + 1) / (config.smokeCount + 1);
    const distance = progress * config.maxDistance * 0.6;
    const lateral = (rng() - 0.5) * config.spread * 1.4;

    return {
      alpha: 0.22 - progress * 0.06,
      lifetimeMs: 170 + progress * 60,
      rotation: 0,
      scale: 0.7 + progress * 0.35,
      x: origin.x + aimDirection.x * distance + perpendicular.x * lateral,
      y: origin.y + aimDirection.y * distance + perpendicular.y * (lateral - 6)
    };
  });

  return { flames, smokes };
}
