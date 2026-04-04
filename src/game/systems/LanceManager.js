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
    const graphics = this.scene?.add?.graphics?.();

    if (!graphics) {
      return;
    }

    const endX = origin.x + aimDirection.x * (stats.lanceLength ?? 0);
    const endY = origin.y + aimDirection.y * (stats.lanceLength ?? 0);

    graphics.lineStyle(Math.max(2, (stats.lanceWidth ?? 0) * 0.35), 0xb3f6ff, 0.95);
    graphics.beginPath();
    graphics.moveTo(origin.x, origin.y);
    graphics.lineTo(endX, endY);
    graphics.strokePath();
    this.scene.time?.delayedCall?.(70, () => graphics.destroy?.());
  }
}
