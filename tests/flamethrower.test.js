import { describe, expect, it } from 'vitest';
import { FlamethrowerManager } from '../src/game/systems/FlamethrowerManager.js';

describe('FlamethrowerManager', () => {
  it('damages enemies inside the active flame cone only', () => {
    const hits = [];
    const manager = new FlamethrowerManager();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      flamethrowerUnlocked: true,
      flamethrowerDamage: 4,
      flamethrowerRange: 90,
      flamethrowerCooldownMs: 140,
      flamethrowerArcDeg: 60
    };
    const enemies = [
      { active: true, x: 40, y: 5, id: 'inside' },
      { active: true, x: -40, y: 5, id: 'behind' }
    ];

    manager.update(player, stats, { x: 1, y: 0 }, 1000, enemies, {
      damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage })
    });

    expect(hits).toEqual([{ id: 'inside', damage: 4 }]);
  });

  it('spawns flame visuals when the flamethrower fires a damaging tick', () => {
    const created = [];
    const manager = new FlamethrowerManager({
      add: {
        image: (x, y, key) => {
          const sprite = {
            active: true,
            alpha: 1,
            key,
            visible: true,
            setActive(value) {
              this.active = value;
              return this;
            },
            setAlpha(value) {
              this.alpha = value;
              return this;
            },
            setDepth() {
              return this;
            },
            setPosition(xPos, yPos) {
              this.x = xPos;
              this.y = yPos;
              return this;
            },
            setRotation(value) {
              this.rotation = value;
              return this;
            },
            setScale(value) {
              this.scale = value;
              return this;
            },
            setTexture(nextKey) {
              this.key = nextKey;
              return this;
            },
            setVisible(value) {
              this.visible = value;
              return this;
            }
          };
          created.push(sprite);
          return sprite;
        }
      }
    });
    const hits = [];

    manager.update(
      { sprite: { x: 0, y: 0 } },
      {
        flamethrowerUnlocked: true,
        flamethrowerDamage: 4,
        flamethrowerRange: 90,
        flamethrowerCooldownMs: 140,
        flamethrowerArcDeg: 60
      },
      { x: 1, y: 0 },
      1000,
      [{ active: true, x: 30, y: 0, id: 'inside' }],
      { damageEnemy: (enemy, damage) => hits.push({ id: enemy.id, damage }) }
    );

    expect(hits).toEqual([{ id: 'inside', damage: 4 }]);
    expect(created.some((sprite) => sprite.key.startsWith('flame-puff-'))).toBe(true);
  });

  it('reuses inactive flame visuals before creating more', () => {
    const created = [];
    const scene = {
      add: {
        image: (x, y, key) => {
          const sprite = {
            active: true,
            key,
            visible: true,
            setActive(value) {
              this.active = value;
              return this;
            },
            setAlpha() {
              return this;
            },
            setDepth() {
              return this;
            },
            setPosition() {
              return this;
            },
            setRotation() {
              return this;
            },
            setScale() {
              return this;
            },
            setTexture(nextKey) {
              this.key = nextKey;
              return this;
            },
            setVisible(value) {
              this.visible = value;
              return this;
            }
          };
          created.push(sprite);
          return sprite;
        }
      }
    };
    const manager = new FlamethrowerManager(scene);

    const visual = manager.getReusableVisual('flame');
    visual.setActive(false);
    manager.getReusableVisual('flame');

    expect(created).toHaveLength(1);
  });
});
