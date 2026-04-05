import { buildLightningBoltSegments, getChainTargets } from '../logic/chain.js';

export class ChainManager {
  constructor(scene) {
    this.scene = scene;
    this.nextCastAt = 0;
  }

  update(player, stats, now, enemies, enemyManager) {
    if (!stats.chainUnlocked || now < this.nextCastAt) {
      return false;
    }

    const targets = getChainTargets(player.sprite, enemies?.enemies ?? enemies, stats.chainLinks, stats.chainRange);

    if (targets.length === 0) {
      return false;
    }

    this.nextCastAt = now + stats.chainCooldownMs;
    targets.forEach((enemy) => enemyManager.damageEnemy(enemy, stats.chainDamage, 'chain'));
    this.renderArc(player.sprite, targets);
    return true;
  }

  renderArc(origin, targets) {
    const graphics = this.scene.add?.graphics?.();

    if (!graphics) {
      return;
    }

    graphics.clear();

    let startPoint = origin;
    targets.forEach((enemy) => {
      const bolt = buildLightningBoltSegments(startPoint, enemy);
      const paths = [
        { points: bolt.mainPoints, width: 8, color: 0x7258ff, alpha: 0.22 },
        { points: bolt.mainPoints, width: 4, color: 0x89c8ff, alpha: 0.68 },
        { points: bolt.mainPoints, width: 2, color: 0xf6fcff, alpha: 0.98 }
      ];

      bolt.branches.forEach((branch) => {
        paths.push(
          { points: branch, width: 3, color: 0x7d6bff, alpha: 0.16 },
          { points: branch, width: 1.5, color: 0xdaf5ff, alpha: 0.72 }
        );
      });

      paths.forEach((path) => {
        graphics.lineStyle(path.width, path.color, path.alpha);
        graphics.beginPath();
        graphics.moveTo(path.points[0].x, path.points[0].y);
        path.points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
        graphics.strokePath();
      });

      startPoint = enemy;
    });

    this.scene.time?.delayedCall?.(90, () => graphics.destroy());
  }
}
