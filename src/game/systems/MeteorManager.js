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

    const meteorTargets = enemies?.enemies ?? enemies;

    if (now >= this.nextCastAt) {
      const targets = getMeteorTargets(player.sprite, meteorTargets, stats.meteorCount);

      if (targets.length > 0) {
        targets.forEach((enemy) => this.queueStrike(enemy, stats, now));
        this.nextCastAt = now + stats.meteorCooldownMs;
      }
    }

    let resolvedStrike = false;

    while (this.pendingStrikes[0] && this.pendingStrikes[0].impactAt <= now) {
      const strike = this.pendingStrikes.shift();
      strike.marker.destroy?.();
      strike.fallingMeteor?.destroy?.();
      resolveMeteorStrike(strike, enemies, enemyManager);
      this.renderImpact(strike);
      resolvedStrike = true;
    }

    return resolvedStrike;
  }

  queueStrike(enemy, stats, now) {
    const marker = this.scene.add?.image?.(enemy.x, enemy.y, 'meteor-marker');
    const [spawnX, spawnY] = this.getMeteorSpawnPosition(enemy.x, enemy.y);
    const fallingMeteor = this.scene.add?.image?.(spawnX, spawnY, 'meteor-fall');

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
    fallingMeteor?.setDepth?.(3);
    fallingMeteor?.setScale?.(0.95);
    fallingMeteor?.setAlpha?.(0.96);
    fallingMeteor?.setRotation?.(this.getMeteorRotation(spawnX, spawnY, enemy.x, enemy.y));
    this.scene.tweens?.add?.({
      alpha: 0.9,
      duration: METEOR_WARNING_MS,
      scaleX: 0.56,
      scaleY: 0.56,
      targets: fallingMeteor,
      x: enemy.x,
      y: enemy.y
    });

    this.pendingStrikes.push({
      damage: stats.meteorDamage,
      fallingMeteor,
      impactAt: now + METEOR_WARNING_MS,
      marker,
      radius: stats.meteorRadius,
      x: enemy.x,
      y: enemy.y
    });
  }

  renderImpact(strike) {
    const impact = this.scene.add?.image?.(strike.x, strike.y, 'meteor-explosion');

    if (!impact) {
      return;
    }

    impact.setDepth?.(4);
    impact.setScale?.(0.3);
    impact.setAlpha?.(0.98);
    impact.setTintFill?.(0xffb17a);
    this.scene.tweens?.add?.({
      alpha: 0,
      duration: 260,
      scaleX: strike.radius / 12,
      scaleY: strike.radius / 12,
      targets: impact,
      onComplete: () => impact.destroy?.()
    });
  }

  getMeteorSpawnPosition(targetX, targetY) {
    const camera = this.scene.cameras?.main;
    const startY = camera ? camera.scrollY - 120 : targetY - 280;
    const startX = camera ? targetX - camera.width * 0.18 : targetX - 180;

    return [startX, startY];
  }

  getMeteorRotation(startX, startY, targetX, targetY) {
    return Math.atan2(targetY - startY, targetX - startX);
  }
}
