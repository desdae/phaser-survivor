import { buildFlameStreamPuffs } from '../logic/flamethrowerVfx.js';

function getConeHits(player, stats, aimDirection, enemies) {
  const maxAngle = ((stats.flamethrowerArcDeg ?? 0) * Math.PI) / 360;
  const maxDistance = stats.flamethrowerRange ?? 0;
  const hits = [];

  for (const enemy of enemies?.enemies ?? enemies ?? []) {
    if (!enemy?.active) {
      continue;
    }

    const dx = enemy.x - player.sprite.x;
    const dy = enemy.y - player.sprite.y;
    const distance = Math.hypot(dx, dy);

    if (!distance || distance > maxDistance) {
      continue;
    }

    const dot = (dx / distance) * aimDirection.x + (dy / distance) * aimDirection.y;
    const angle = Math.acos(Math.min(1, Math.max(-1, dot)));

    if (angle <= maxAngle) {
      hits.push(enemy);
    }
  }

  return hits;
}

export class FlamethrowerManager {
  constructor(scene = null) {
    this.scene = scene;
    this.nextTickAt = 0;
    this.flameVisuals = [];
    this.smokeVisuals = [];
  }

  getReusableVisual(kind) {
    const pool = kind === 'smoke' ? this.smokeVisuals : this.flameVisuals;
    const existing = pool.find((sprite) => !sprite.active);

    if (existing) {
      existing.setActive(true).setVisible(true);
      return existing;
    }

    const textureKey = kind === 'smoke' ? 'flame-smoke-0' : 'flame-puff-0';
    const sprite = this.scene?.add?.image?.(0, 0, textureKey);

    if (!sprite) {
      return null;
    }

    sprite?.setDepth?.(2.9);
    pool.push(sprite);
    return sprite;
  }

  updateVisuals(now) {
    for (const sprite of [...this.flameVisuals, ...this.smokeVisuals]) {
      if (!sprite?.active || sprite.expiresAt > now) {
        continue;
      }

      sprite.setActive(false).setVisible(false);
    }
  }

  emitStream(player, aimDirection, stats, now) {
    const stream = buildFlameStreamPuffs(
      player.sprite,
      aimDirection,
      {
        flameCount: 5,
        jitter: 0.5,
        maxDistance: stats.flamethrowerRange,
        smokeCount: 2,
        spread: 10
      }
    );

    stream.flames.forEach((puff) => {
      const sprite = this.getReusableVisual('flame');
      if (!sprite) {
        return;
      }
      sprite
        .setTexture(`flame-puff-${puff.textureIndex}`)
        .setPosition(puff.x, puff.y)
        .setRotation(puff.rotation)
        .setScale(puff.scale)
        .setAlpha(puff.alpha);
      sprite.expiresAt = now + puff.lifetimeMs;
    });

    stream.smokes.forEach((puff) => {
      const sprite = this.getReusableVisual('smoke');
      if (!sprite) {
        return;
      }
      sprite
        .setTexture('flame-smoke-0')
        .setPosition(puff.x, puff.y)
        .setRotation(puff.rotation)
        .setScale(puff.scale)
        .setAlpha(puff.alpha);
      sprite.expiresAt = now + puff.lifetimeMs;
    });
  }

  update(player, stats, aimDirection, now, enemies, enemyManager) {
    this.updateVisuals(now);

    if (!stats.flamethrowerUnlocked || now < this.nextTickAt) {
      return false;
    }

    const hits = getConeHits(player, stats, aimDirection, enemies);

    if (hits.length === 0) {
      return false;
    }

    this.nextTickAt = now + (stats.flamethrowerCooldownMs ?? 0);
    hits.forEach((enemy) => enemyManager.damageEnemy(enemy, stats.flamethrowerDamage, 'flamethrower'));
    this.emitStream(player, aimDirection, stats, now);
    return true;
  }
}
