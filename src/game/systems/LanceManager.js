function getLanceHits(origin, aimDirection, enemies, length, width) {
  const hits = [];

  for (const enemy of enemies?.enemies ?? enemies ?? []) {
    if (!enemy?.active) {
      continue;
    }

    const dx = enemy.x - origin.x;
    const dy = enemy.y - origin.y;
    const along = dx * aimDirection.x + dy * aimDirection.y;

    if (along < 0 || along > length) {
      continue;
    }

    const perpendicular = Math.abs(dx * aimDirection.y - dy * aimDirection.x);

    if (perpendicular <= width) {
      hits.push(enemy);
    }
  }

  return hits;
}

export class LanceManager {
  constructor(scene = null) {
    this.scene = scene;
    this.nextFireAt = 0;
  }

  update(player, stats, aimDirection, now, enemies, enemyManager) {
    if (!stats.lanceUnlocked || now < this.nextFireAt) {
      return false;
    }

    const hits = getLanceHits(
      player.sprite,
      aimDirection,
      enemies,
      stats.lanceLength ?? 0,
      stats.lanceWidth ?? 0
    );

    if (hits.length === 0) {
      return false;
    }

    this.nextFireAt = now + (stats.lanceCooldownMs ?? 0);
    hits.forEach((enemy) => enemyManager.damageEnemy(enemy, stats.lanceDamage, 'lance'));
    this.render(player.sprite, aimDirection, stats);
    return true;
  }

  render(origin, aimDirection, stats) {
    const add = this.scene?.add;
    const time = this.scene?.time;

    if (!add?.image || !time?.delayedCall) {
      return;
    }

    const rotation = Math.atan2(aimDirection.y, aimDirection.x);
    const midX = origin.x + aimDirection.x * ((stats.lanceLength ?? 0) * 0.5);
    const midY = origin.y + aimDirection.y * ((stats.lanceLength ?? 0) * 0.5);
    const strike = add.image(midX, midY, 'lance-strike');
    const trail = add.image(midX - aimDirection.x * 14, midY - aimDirection.y * 14, 'lance-trail');

    trail.setDepth?.(2.8);
    trail.setOrigin?.(0.14, 0.5);
    trail.setRotation?.(rotation);
    trail.setScale?.(
      Math.max(0.7, (stats.lanceLength ?? 0) / 180),
      Math.max(0.8, (stats.lanceWidth ?? 0) / 16)
    );
    trail.setAlpha?.(0.52);
    trail.setTintFill?.(0x8fefff);

    strike.setDepth?.(3);
    strike.setOrigin?.(0.12, 0.5);
    strike.setRotation?.(rotation);
    strike.setScale?.(
      Math.max(0.8, (stats.lanceLength ?? 0) / 180),
      Math.max(0.8, (stats.lanceWidth ?? 0) / 18)
    );
    strike.setAlpha?.(0.98);

    time.delayedCall(70, () => {
      strike.destroy?.();
      trail.destroy?.();
    });
  }
}
