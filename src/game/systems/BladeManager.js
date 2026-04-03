import Phaser from 'phaser';
import {
  BLADE_CONTACT_RADIUS,
  BLADE_DAMAGE_COOLDOWN_MS,
  getBladePositions,
  shouldBladeDamageEnemy
} from '../logic/blade.js';

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
      const blade = this.group.getChildren()[this.group.getLength() - 1];
      this.group.remove(blade, true, true);
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

        if (distance <= BLADE_CONTACT_RADIUS && shouldBladeDamageEnemy(now, enemy.nextBladeDamageAt ?? 0)) {
          enemy.nextBladeDamageAt = now + BLADE_DAMAGE_COOLDOWN_MS;
          enemyManager.damageEnemy(enemy, playerStats.bladeDamage);
        }
      }
    }
  }
}
