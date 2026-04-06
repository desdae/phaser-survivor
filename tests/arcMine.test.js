import { describe, expect, it } from 'vitest';
import { ArcMineManager } from '../src/game/systems/ArcMineManager.js';

describe('ArcMineManager', () => {
  it('places a mine first, then chains damage after the short arming delay', () => {
    const hits = [];
    const scene = {
      add: {
        image: () => ({
          setDepth() {
            return this;
          },
          setScale() {
            return this;
          },
          setAlpha() {
            return this;
          },
          setPosition() {
            return this;
          },
          destroy() {}
        }),
        graphics: () => ({
          clear() {},
          fillStyle() {},
          fillCircle() {},
          lineStyle() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          strokePath() {},
          destroy() {}
        })
      },
      tweens: {
        add() {}
      },
      time: {
        delayedCall() {}
      }
    };
    const manager = new ArcMineManager(scene);
    const stats = {
      arcMineUnlocked: true,
      arcMineDamage: 16,
      arcMineChains: 2,
      arcMineTriggerRadius: 20,
      arcMineChainRange: 32,
      arcMineCooldownMs: 900
    };
    const enemies = [
      { active: true, x: 8, y: 0, id: 'first' },
      { active: true, x: 24, y: 4, id: 'second' }
    ];

    const placed = manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 0, y: 0 }, 1000, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });
    const stillArming = manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 0, y: 0 }, 1080, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 0, y: 0 }, 1200, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });

    expect(placed).toBe(true);
    expect(stillArming).toBe(false);
    expect(hits).toHaveLength(2);
    expect(hits.map((hit) => hit.id)).toEqual(['first', 'second']);
  });

  it('spawns a visible mine and lightning burst visuals when a scene is available', () => {
    const images = [];
    const graphicsObjects = [];
    const scene = {
      add: {
        image: () => {
          const image = {
            setDepth() {
              return this;
            },
            setScale() {
              return this;
            },
            setAlpha() {
              return this;
            },
            setPosition() {
              return this;
            },
            destroy() {}
          };
          images.push(image);
          return image;
        },
        graphics: () => {
          const graphics = {
            clear() {},
            fillStyle() {},
            fillCircle() {},
            lineStyle() {},
            beginPath() {},
            moveTo() {},
            lineTo() {},
            strokePath() {},
            destroy() {}
          };
          graphicsObjects.push(graphics);
          return graphics;
        }
      },
      tweens: {
        add() {}
      },
      time: {
        delayedCall(delay, callback) {
          if (delay >= 100) {
            callback();
          }
        }
      }
    };
    const manager = new ArcMineManager(scene);
    const stats = {
      arcMineUnlocked: true,
      arcMineDamage: 16,
      arcMineChains: 1,
      arcMineTriggerRadius: 20,
      arcMineChainRange: 32,
      arcMineCooldownMs: 900
    };
    const enemies = [{ active: true, x: 8, y: 0, id: 'first' }];

    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 0, y: 0 }, 1000, enemies, {
      damageEnemy() {}
    });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 0, y: 0 }, 1200, enemies, {
      damageEnemy() {}
    });

    expect(images).toHaveLength(1);
    expect(graphicsObjects.length).toBeGreaterThan(0);
  });
});
