import { describe, expect, it, vi } from 'vitest';
import { BloodEffectsManager } from '../src/game/systems/BloodEffectsManager.js';

function createParticleSprite() {
  return {
    alpha: 1,
    depth: 0,
    scale: 1,
    tint: null,
    x: 0,
    y: 0,
    destroy: vi.fn(),
    setAlpha(alpha) {
      this.alpha = alpha;
      return this;
    },
    setDepth(depth) {
      this.depth = depth;
      return this;
    },
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    setScale(scale) {
      this.scale = scale;
      return this;
    },
    setTintFill(tint) {
      this.tint = tint;
      return this;
    }
  };
}

describe('BloodEffectsManager', () => {
  it('spawns a lighter burst on hit and a bigger burst on death', () => {
    const sprites = [];
    const scene = {
      add: {
        image: vi.fn(() => {
          const sprite = createParticleSprite();
          sprites.push(sprite);
          return sprite;
        })
      },
      tweens: {
        add: vi.fn()
      },
      time: {
        delayedCall: vi.fn()
      }
    };
    const manager = new BloodEffectsManager(scene);

    manager.spawnHitSplash({ x: 20, y: 30 }, false);
    manager.spawnDeathSplash({ x: 20, y: 30 });

    expect(scene.add.image).toHaveBeenCalled();
    expect(sprites.length).toBeGreaterThan(10);
  });

  it('creates a blood puddle that lasts about 30 seconds before fading', () => {
    const puddles = [];
    const delayedCall = vi.fn((delayMs, callback) => ({ callback, delayMs }));
    const scene = {
      add: {
        image: vi.fn((x, y, key) => {
          const sprite = createParticleSprite();
          sprite.textureKey = key;
          puddles.push(sprite);
          return sprite;
        })
      },
      tweens: {
        add: vi.fn()
      },
      time: {
        delayedCall
      }
    };
    const manager = new BloodEffectsManager(scene);

    manager.spawnPuddle({ x: 44, y: 88 });

    expect(puddles).toHaveLength(1);
    expect(puddles[0].depth).toBe(1.5);
    expect(puddles[0].textureKey).toMatch(/^blood-puddle-(\d|[1-7])$/);
    expect(puddles[0].alpha).toBe(0.54);
    expect(delayedCall).toHaveBeenCalledWith(30000, expect.any(Function));
  });
});
