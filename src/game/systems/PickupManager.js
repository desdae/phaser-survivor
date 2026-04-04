export class PickupManager {
  constructor(scene, onCollect) {
    this.scene = scene;
    this.onCollect = onCollect;
    this.group = scene.physics.add.group();
  }

  spawnOrb(x, y, value) {
    return this.spawnPickup(x, y, 'xp-orb', 'xp', value);
  }

  spawnHeart(x, y, value = 10) {
    return this.spawnPickup(x, y, 'heart-pickup', 'heart', value);
  }

  spawnPowerup(x, y, buffKey) {
    const pickup = this.spawnPickup(x, y, `powerup-${buffKey}`, 'powerup', 0);

    pickup.buffKey = buffKey;
    pickup.setDepth(2.2);

    return pickup;
  }

  spawnChest(x, y, rewardSeed = null) {
    const pickup = this.spawnPickup(x, y, 'reward-chest', 'chest', 0);
    pickup.rewardSeed = rewardSeed;
    return pickup;
  }

  spawnPickup(x, y, texture, kind, value) {
    const pickup = this.group.create(x, y, texture);

    pickup.kind = kind;
    pickup.value = value;
    pickup.setDepth(kind === 'heart' ? 2.1 : kind === 'chest' ? 2.4 : 2);
    pickup.setDamping(true);
    pickup.setDrag(0.96);
    pickup.setMaxVelocity(180, 180);

    return pickup;
  }

  pullNearbyToPlayer(playerSprite, radius = 260, speed = 440) {
    if (!playerSprite) {
      return;
    }

    const radiusSq = radius * radius;

    for (const pickup of this.group.getChildren()) {
      if (!pickup?.active || pickup.kind === 'chest') {
        continue;
      }

      const dx = playerSprite.x - pickup.x;
      const dy = playerSprite.y - pickup.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq > radiusSq) {
        continue;
      }

      const distance = Math.hypot(dx, dy) || 1;
      pickup.setVelocity((dx / distance) * speed, (dy / distance) * speed);
    }
  }

  update(playerSprite, pickupRadius) {
    const pickupRadiusSq = pickupRadius * pickupRadius;
    const attractRadiusSq = pickupRadiusSq * 4;
    const orbs = this.group.getChildren();

    for (const pickup of orbs) {
      if (!pickup?.active) {
        continue;
      }

      const dx = playerSprite.x - pickup.x;
      const dy = playerSprite.y - pickup.y;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq <= pickupRadiusSq) {
        const collectPayload = {
          kind: pickup.kind ?? 'xp',
          value: pickup.value
        };

        if (pickup.rewardSeed !== undefined) {
          collectPayload.rewardSeed = pickup.rewardSeed;
        }

        if (pickup.buffKey !== undefined) {
          collectPayload.buffKey = pickup.buffKey;
        }

        const shouldPause = this.onCollect(collectPayload);
        pickup.destroy();
        if (shouldPause) {
          break;
        }
        continue;
      }

      if (pickup.kind === 'chest') {
        pickup.setVelocity(0, 0);
        continue;
      }

      if (distanceSq <= attractRadiusSq) {
        const distance = Math.hypot(dx, dy) || 1;
        pickup.setVelocity((dx / distance) * 150, (dy / distance) * 150);
      } else {
        pickup.setVelocity(0, 0);
      }
    }
  }
}
