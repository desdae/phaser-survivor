import { getNovaTargets, queueNovaBursts } from '../logic/nova.js';

const NOVA_ECHO_DELAY_MS = 180;

export class NovaManager {
  constructor(scene) {
    this.scene = scene;
    this.nextCastAt = 0;
    this.pendingBursts = [];
  }

  update(player, stats, now, enemies, enemyManager) {
    if (!stats.novaUnlocked) {
      return false;
    }

    if (now >= this.nextCastAt && this.pendingBursts.length === 0) {
      this.pendingBursts = queueNovaBursts(now, stats.novaEchoCount, NOVA_ECHO_DELAY_MS).map((burstAt) => ({
        burstAt,
        damage: stats.novaDamage,
        radius: stats.novaRadius,
        x: player.sprite.x,
        y: player.sprite.y
      }));
      this.nextCastAt = now + stats.novaCooldownMs;
    }

    let triggeredBurst = false;

    while (this.pendingBursts[0] && this.pendingBursts[0].burstAt <= now) {
      const burst = this.pendingBursts.shift();
      const targets = getNovaTargets(burst, enemies, burst.radius);

      targets.forEach((enemy) => enemyManager.damageEnemy(enemy, burst.damage, 'nova'));
      this.renderBurst(burst);
      triggeredBurst = true;
    }

    return triggeredBurst;
  }

  renderBurst(burst) {
    const ring = this.scene.add?.image?.(burst.x, burst.y, 'nova-ring');

    if (!ring) {
      return;
    }

    ring.setDepth?.(2);
    ring.setAlpha?.(0.75);
    ring.setScale?.(0.2);
    ring.setVisible?.(true);
    this.scene.tweens?.add?.({
      alpha: 0,
      duration: 200,
      scaleX: burst.radius / 22,
      scaleY: burst.radius / 22,
      targets: ring,
      onComplete: () => ring.destroy?.()
    });
  }
}
