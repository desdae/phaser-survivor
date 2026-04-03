import Phaser from 'phaser';
import { getBladePositions, shouldBladeDamageEnemy } from '../logic/blade.js';

export class BladeManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.add.group();
    this.rotationRad = 0;
  }

  syncToPlayer(playerStats) {
    while (this.group.getLength() < playerStats.bladeCount) {
      const sprite = this.scene.add.image(0, 0, 'blade');
      sprite.setDepth(6);
      this.group.add(sprite);
    }

    while (this.group.getLength() > playerStats.bladeCount) {
      this.group.getChildren().pop().destroy();
    }
  }

  update(player, playerStats, deltaMs, now, enemies, enemyManager) {
    if (!playerStats.bladeUnlocked || playerStats.bladeCount === 0) {
      this.group.getChildren().forEach((blade) => blade.setVisible(false));
      return;
    }

    this.group.getChildren().forEach((blade) => blade.setVisible(true));
    this.rotationRad += (deltaMs / 1000) * playerStats.bladeOrbitSpeed;

    const points = getBladePositions(
      player.sprite,
      playerStats.bladeCount,
      playerStats.bladeOrbitRadius,
      this.rotationRad
    );

    this.group.getChildren().forEach((blade, index) => {
      const point = points[index];
      blade.setPosition(point.x, point.y);
      blade.setRotation(this.rotationRad + index);
    });

    for (const enemy of enemies) {
      for (const blade of this.group.getChildren()) {
        if (!enemy.active) {
          continue;
        }

        const distance = Phaser.Math.Distance.Between(blade.x, blade.y, enemy.x, enemy.y);

        if (distance <= 24 && shouldBladeDamageEnemy(now, enemy.nextBladeDamageAt ?? 0)) {
          enemy.nextBladeDamageAt = now + 280;
          enemyManager.damageEnemy(enemy, playerStats.bladeDamage);
        }
      }
    }
  }
}
