const HIT_SPLASH_COUNT = 6;
const DEATH_SPLASH_COUNT = 14;
const PUDDLE_LIFETIME_MS = 30000;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export class BloodEffectsManager {
  constructor(scene) {
    this.scene = scene;
  }

  spawnHitSplash(target, isFatal = false) {
    const particleCount = isFatal ? DEATH_SPLASH_COUNT : HIT_SPLASH_COUNT;
    const speedMin = isFatal ? 70 : 40;
    const speedMax = isFatal ? 170 : 100;
    const scaleMin = isFatal ? 0.45 : 0.28;
    const scaleMax = isFatal ? 0.95 : 0.55;

    for (let index = 0; index < particleCount; index += 1) {
      const droplet = this.scene.add.image(target.x, target.y, 'blood-drop');
      const angle = Math.random() * Math.PI * 2;
      const distance = randomBetween(speedMin, speedMax);
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;

      droplet.setDepth(3.2);
      droplet.setScale(randomBetween(scaleMin, scaleMax));
      droplet.setAlpha(0.9);
      droplet.setTintFill(isFatal ? 0x8b121d : 0xa11724);

      this.scene.tweens.add({
        alpha: 0,
        duration: randomBetween(220, isFatal ? 620 : 420),
        scale: droplet.scale * randomBetween(0.7, 1.4),
        targets: droplet,
        x: target.x + offsetX,
        y: target.y + offsetY,
        onComplete: () => droplet.destroy()
      });
    }
  }

  spawnDeathSplash(target) {
    this.spawnHitSplash(target, true);
  }

  spawnPuddle(target) {
    const puddle = this.scene.add.image(target.x, target.y + 4, 'blood-puddle');

    puddle.setDepth(1.5);
    puddle.setAlpha(0.68);
    puddle.setScale(randomBetween(0.8, 1.25));
    puddle.setTintFill(0x5f0c16);

    this.scene.time.delayedCall(PUDDLE_LIFETIME_MS, () => {
      this.scene.tweens.add({
        alpha: 0,
        duration: 800,
        targets: puddle,
        onComplete: () => puddle.destroy()
      });
    });
  }
}
