import {
  SPEAR_WARNING_MS,
  getSpearFlightRotation,
  getSpearSpawnPosition,
  getSpearVisualState
} from '../logic/spearBarrageVisuals.js';

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
        const state = getSpearVisualState(strike, now);
        strike.fallingSpear?.setPosition?.(state.x, state.y);
        strike.fallingSpear?.setScale?.(state.scale);
        strike.fallingSpear?.setAlpha?.(state.alpha);
        strike.shadow?.setScale?.(0.42 + state.progress * 0.12, 0.14 + state.progress * 0.08);
        strike.shadow?.setAlpha?.(0.08 + state.progress * 0.18);
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

      strike.fallingSpear?.setPosition?.(strike.x, strike.y);
      strike.fallingSpear?.setScale?.(0.76);
      strike.fallingSpear?.setAlpha?.(1);
      strike.shadow?.setAlpha?.(0.26);
      strike.marker?.destroy?.();
      strike.fallingSpear?.destroy?.();
      strike.shadow?.destroy?.();
      this.renderImpact(strike);
      return false;
    });

    return landed;
  }

  queueStrikes(cursorWorld, stats, now) {
    for (const offset of getStrikeOffsets(Math.max(1, stats.spearBarrageCount ?? 1))) {
      const x = cursorWorld.x + offset.x;
      const y = cursorWorld.y + offset.y;
      const marker = this.scene?.add?.image?.(x, y, 'spear-barrage-marker');
      const [spawnX, spawnY] = getSpearSpawnPosition(x, y, this.scene?.cameras?.main);
      const fallingSpear = this.scene?.add?.image?.(spawnX, spawnY, 'spear-barrage-fall');
      const shadow = this.scene?.add?.image?.(x, y, 'spear-barrage-shadow');
      const rotation = getSpearFlightRotation(spawnX, spawnY, x, y);

      marker?.setDepth?.(2);
      marker?.setScale?.(1);
      marker?.setAlpha?.(0.82);
      marker?.setTintFill?.(0xffe0b7);
      this.scene?.tweens?.add?.({
        alpha: 0.38,
        duration: SPEAR_WARNING_MS,
        scaleX: 0.74,
        scaleY: 0.74,
        targets: marker
      });
      shadow?.setDepth?.(2.2);
      shadow?.setRotation?.(rotation);
      shadow?.setScale?.(0.42, 0.14);
      shadow?.setAlpha?.(0.08);
      shadow?.setTintFill?.(0x24150f);
      fallingSpear?.setDepth?.(3);
      fallingSpear?.setRotation?.(rotation);
      fallingSpear?.setScale?.(1.18);
      fallingSpear?.setAlpha?.(0.88);

      this.pendingStrikes.push({
        damage: stats.spearBarrageDamage ?? 0,
        fallingSpear,
        landsAt: now + SPEAR_WARNING_MS,
        marker,
        radius: stats.spearBarrageRadius ?? 0,
        shadow,
        spawnX,
        spawnY,
        x,
        y
      });
    }
  }

  renderImpact(strike) {
    const impact = this.scene?.add?.image?.(strike.x, strike.y, 'spear-barrage-impact');

    if (!impact) {
      return;
    }

    impact.setDepth?.(4);
    impact.setScale?.(0.34);
    impact.setAlpha?.(0.96);
    impact.setTintFill?.(0xffc58f);
    this.scene?.tweens?.add?.({
      alpha: 0,
      duration: 180,
      scaleX: strike.radius / 14,
      scaleY: strike.radius / 14,
      targets: impact,
      onComplete: () => impact.destroy?.()
    });
  }
}
