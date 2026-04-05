const SPEAR_WARNING_MS = 220;

function getStrikeOffsets(count) {
  if (count <= 1) {
    return [{ x: 0, y: 0 }];
  }

  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    return {
      x: Math.cos(angle) * 12,
      y: Math.sin(angle) * 12
    };
  });
}

export class SpearBarrageManager {
  constructor(scene = null) {
    this.scene = scene;
    this.pendingStrikes = [];
    this.nextCastAt = 0;
  }

  update(player, stats, cursorWorld, now, enemies, enemyManager) {
    if (!stats.spearBarrageUnlocked) {
      return false;
    }

    if (now >= this.nextCastAt) {
      this.queueStrikes(cursorWorld, stats, now);
      this.nextCastAt = now + (stats.spearBarrageCooldownMs ?? 0);
    }

    let landed = false;
    this.pendingStrikes = this.pendingStrikes.filter((strike) => {
      if (now < strike.landsAt) {
        return true;
      }

      for (const enemy of enemies?.enemies ?? enemies ?? []) {
        if (!enemy?.active) {
          continue;
        }

        const dx = enemy.x - strike.x;
        const dy = enemy.y - strike.y;
        if (dx * dx + dy * dy <= strike.radius * strike.radius) {
          enemyManager.damageEnemy(enemy, strike.damage, 'spearBarrage');
          landed = true;
        }
      }

      strike.marker?.destroy?.();
      return false;
    });

    return landed;
  }

  queueStrikes(cursorWorld, stats, now) {
    for (const offset of getStrikeOffsets(Math.max(1, stats.spearBarrageCount ?? 1))) {
      const marker = this.scene?.add?.image?.(cursorWorld.x + offset.x, cursorWorld.y + offset.y, 'meteor-marker');
      marker?.setDepth?.(2);
      marker?.setScale?.(0.3);
      marker?.setTintFill?.(0xdde9ff);

      this.pendingStrikes.push({
        damage: stats.spearBarrageDamage ?? 0,
        landsAt: now + SPEAR_WARNING_MS,
        marker,
        radius: stats.spearBarrageRadius ?? 0,
        x: cursorWorld.x + offset.x,
        y: cursorWorld.y + offset.y
      });
    }
  }
}
