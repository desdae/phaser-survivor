import { getChainTargets } from '../logic/chain.js';

export class ChainManager {
  constructor(scene) {
    this.scene = scene;
    this.nextCastAt = 0;
  }

  update(player, stats, now, enemies, enemyManager) {
    if (!stats.chainUnlocked || now < this.nextCastAt) {
      return false;
    }

    const targets = getChainTargets(player.sprite, enemies, stats.chainLinks, stats.chainRange);

    if (targets.length === 0) {
      return false;
    }

    this.nextCastAt = now + stats.chainCooldownMs;
    targets.forEach((enemy) => enemyManager.damageEnemy(enemy, stats.chainDamage));
    this.renderArc(player.sprite, targets);
    return true;
  }

  renderArc(origin, targets) {
    const graphics = this.scene.add?.graphics?.();

    if (!graphics) {
      return;
    }

    graphics.clear();
    graphics.lineStyle(3, 0x9fe6ff, 0.95);
    graphics.beginPath();
    graphics.moveTo(origin.x, origin.y);
    targets.forEach((enemy) => graphics.lineTo(enemy.x, enemy.y));
    graphics.strokePath();

    this.scene.time?.delayedCall?.(90, () => graphics.destroy());
  }
}
