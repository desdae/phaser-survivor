export class PickupManager {
  constructor(scene, onCollect) {
    this.scene = scene;
    this.onCollect = onCollect;
    this.group = scene.physics.add.group();
  }

  spawnOrb(x, y, value) {
    const orb = this.group.create(x, y, 'xp-orb');

    orb.value = value;
    orb.setDepth(2);
    orb.setDamping(true);
    orb.setDrag(0.96);
    orb.setMaxVelocity(180, 180);

    return orb;
  }

  update(playerSprite, pickupRadius) {
    const pickupRadiusSq = pickupRadius * pickupRadius;
    const attractRadiusSq = pickupRadiusSq * 4;
    const orbs = this.group.getChildren();

    for (const orb of orbs) {
      if (!orb?.active) {
        continue;
      }

      const dx = playerSprite.x - orb.x;
      const dy = playerSprite.y - orb.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq <= pickupRadiusSq) {
        const shouldPause = this.onCollect(orb.value);
        orb.destroy();
        if (shouldPause) {
          break;
        }
        continue;
      }

      if (distanceSq <= attractRadiusSq) {
        const distance = Math.hypot(dx, dy) || 1;
        orb.setVelocity((dx / distance) * 150, (dy / distance) * 150);
      } else {
        orb.setVelocity(0, 0);
      }
    }
  }
}
