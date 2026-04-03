import { getMeteorTargets, resolveMeteorStrike } from '../logic/meteor.js';

const METEOR_WARNING_MS = 720;

export class MeteorManager {
  constructor(scene) {
    this.scene = scene;
    this.nextCastAt = 0;
    this.pendingStrikes = [];
  }

  update(player, stats, now, enemies, enemyManager) {
    if (!stats.meteorUnlocked) {
      return false;
    }

    if (now >= this.nextCastAt) {
      const targets = getMeteorTargets(player.sprite, enemies, stats.meteorCount);

      if (targets.length > 0) {
        targets.forEach((enemy) => this.queueStrike(enemy, stats, now));
        this.nextCastAt = now + stats.meteorCooldownMs;
      }
    }

    let resolvedStrike = false;

    while (this.pendingStrikes[0] && this.pendingStrikes[0].impactAt <= now) {
      const strike = this.pendingStrikes.shift();
      strike.marker.destroy?.();
      resolveMeteorStrike(strike, enemies, enemyManager);
      this.renderImpact(strike);
      resolvedStrike = true;
    }

    return resolvedStrike;
  }

  queueStrike(enemy, stats, now) {
    const marker = this.scene.add?.image?.(enemy.x, enemy.y, 'meteor-marker');

    marker?.setDepth?.(2);
    marker?.setScale?.(0.9);
    marker?.setTintFill?.(0xffd27a);
    this.scene.tweens?.add?.({
      alpha: 0.35,
      duration: METEOR_WARNING_MS,
      scaleX: 0.4,
      scaleY: 0.4,
      targets: marker
    });

    this.pendingStrikes.push({
      damage: stats.meteorDamage,
      impactAt: now + METEOR_WARNING_MS,
      marker,
      radius: stats.meteorRadius,
      x: enemy.x,
      y: enemy.y
    });
  }

  renderImpact(strike) {
    const impact = this.scene.add?.image?.(strike.x, strike.y, 'meteor-marker');

    if (!impact) {
      return;
    }

    impact.setDepth?.(3);
    impact.setScale?.(0.25);
    impact.setTintFill?.(0xff925e);
    this.scene.tweens?.add?.({
      alpha: 0,
      duration: 220,
      scaleX: strike.radius / 18,
      scaleY: strike.radius / 18,
      targets: impact,
      onComplete: () => impact.destroy?.()
    });
  }
}
