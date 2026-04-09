import { describe, expect, it } from 'vitest';
import { RuneTrapManager } from '../src/game/systems/RuneTrapManager.js';

describe('RuneTrapManager', () => {
  it('arms a rune trap after a delay and triggers when an enemy steps inside', () => {
    const hits = [];
    const manager = new RuneTrapManager();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      runeTrapUnlocked: true,
      runeTrapDamage: 22,
      runeTrapArmMs: 400,
      runeTrapRadius: 40,
      runeTrapCharges: 1,
      runeTrapCooldownMs: 1
    };
    const enemy = { active: true, x: 10, y: 0, id: 'enemy' };

    manager.update(player, stats, { x: 32, y: 0 }, 1000, [], { damageEnemy: () => {} });
    manager.update(player, stats, { x: 32, y: 0 }, 1300, [enemy], {
      damageEnemy: (target, damage) => hits.push({ id: target.id, damage })
    });
    manager.update(player, stats, { x: 32, y: 0 }, 1400, [enemy], {
      damageEnemy: (target, damage) => hits.push({ id: target.id, damage })
    });

    expect(hits).toEqual([{ id: 'enemy', damage: 22 }]);
  });

  it('spawns a small occult burst visual when the trap detonates', () => {
    const images = [];
    const scene = {
      add: {
        image: (x, y, texture) => {
          const image = {
            texture,
            x,
            y,
            setAlpha() {
              return this;
            },
            setDepth() {
              return this;
            },
            setScale() {
              return this;
            },
            setTintFill() {
              return this;
            },
            destroy() {}
          };
          images.push(image);
          return image;
        }
      },
      tweens: {
        add() {}
      }
    };
    const manager = new RuneTrapManager(scene);
    const stats = {
      runeTrapUnlocked: true,
      runeTrapDamage: 22,
      runeTrapArmMs: 100,
      runeTrapRadius: 40,
      runeTrapCharges: 1,
      runeTrapCooldownMs: 1
    };
    const enemy = { active: true, x: 10, y: 0, id: 'enemy' };

    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 32, y: 0 }, 1000, [], { damageEnemy: () => {} });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 32, y: 0 }, 1200, [enemy], {
      damageEnemy: () => {}
    });

    expect(images.some((image) => image.texture === 'rune-trap-burst')).toBe(true);
  });

  it('lets extra rune trap charges place a second rune before the cooldown refills', () => {
    const manager = new RuneTrapManager();
    const stats = {
      runeTrapUnlocked: true,
      runeTrapDamage: 22,
      runeTrapArmMs: 100,
      runeTrapRadius: 40,
      runeTrapCharges: 2,
      runeTrapCooldownMs: 900
    };

    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 32, y: 0 }, 1000, [], { damageEnemy: () => {} });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 96, y: 0 }, 1100, [], { damageEnemy: () => {} });

    expect(manager.traps).toHaveLength(2);
    expect(manager.traps[0].x).toBe(32);
    expect(manager.traps[1].x).toBe(96);
  });

  it('expires idle rune traps after fifteen seconds and frees the active slot', () => {
    const marker = {
      destroyed: false,
      setAlpha() {
        return this;
      },
      setDepth() {
        return this;
      },
      destroy() {
        this.destroyed = true;
      }
    };
    const scene = {
      add: {
        image: () => marker
      },
      tweens: {
        add: ({ onComplete }) => onComplete?.()
      }
    };
    const manager = new RuneTrapManager(scene);
    const stats = {
      runeTrapUnlocked: true,
      runeTrapDamage: 22,
      runeTrapArmMs: 100,
      runeTrapRadius: 40,
      runeTrapCharges: 1,
      runeTrapCooldownMs: 900
    };

    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 32, y: 0 }, 1000, [], { damageEnemy: () => {} });
    manager.update({ sprite: { x: 0, y: 0 } }, stats, { x: 96, y: 0 }, 16050, [], { damageEnemy: () => {} });

    expect(marker.destroyed).toBe(true);
    expect(manager.traps).toHaveLength(1);
    expect(manager.traps[0].x).toBe(96);
  });
});
