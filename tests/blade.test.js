import { describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Math: {
      Distance: {
        Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
      }
    }
  }
}));

import { BladeManager } from '../src/game/systems/BladeManager.js';
import { getBladePositions, shouldBladeDamageEnemy } from '../src/game/logic/blade.js';

describe('getBladePositions', () => {
  it('returns one blade position when only one blade is unlocked', () => {
    const points = getBladePositions({ x: 50, y: 75 }, 1, 80, 0);

    expect(points).toEqual([{ x: 130, y: 75 }]);
  });

  it('distributes multiple blades evenly around the player', () => {
    const points = getBladePositions({ x: 0, y: 0 }, 2, 60, 0);

    expect(points[0].x).toBeCloseTo(60, 3);
    expect(points[1].x).toBeCloseTo(-60, 3);
  });
});

describe('shouldBladeDamageEnemy', () => {
  it('uses a per-enemy cooldown', () => {
    expect(shouldBladeDamageEnemy(1000, 0)).toBe(true);
    expect(shouldBladeDamageEnemy(1200, 1600)).toBe(false);
  });
});

describe('BladeManager', () => {
  function createSprite(key = 'blade') {
    return {
      active: true,
      destroyed: false,
      key,
      visible: true,
      x: 0,
      y: 0,
      depth: 0,
      rotation: 0,
      setDepth(depth) {
        this.depth = depth;
        return this;
      },
      setVisible(visible) {
        this.visible = visible;
        return this;
      },
      setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      },
      setRotation(rotation) {
        this.rotation = rotation;
        return this;
      },
      destroy() {
        this.destroyed = true;
        this.active = false;
      }
    };
  }

  function createScene() {
    const children = [];
    const removals = [];

    const group = {
      add(sprite) {
        children.push(sprite);
        return sprite;
      },
      getChildren() {
        return children;
      },
      getLength() {
        return children.length;
      },
      remove(sprite, removeFromScene, destroyChild) {
        removals.push({ destroyChild, removeFromScene, sprite });
        const index = children.indexOf(sprite);
        if (index !== -1) {
          children.splice(index, 1);
        }

        if (destroyChild) {
          sprite.destroy();
        }
      }
    };

    return {
      group,
      removals,
      scene: {
        add: {
          group: () => group,
          image: () => createSprite()
        }
      }
    };
  }

  it('syncs blade sprites to the current blade count using the public removal path', () => {
    const { group, removals, scene } = createScene();
    const manager = new BladeManager(scene);

    manager.syncToPlayer({ bladeCount: 2 });
    expect(group.getChildren()).toHaveLength(2);
    expect(group.getChildren().every((blade) => blade.depth === 6)).toBe(true);

    manager.syncToPlayer({ bladeCount: 1 });

    expect(group.getChildren()).toHaveLength(1);
    expect(removals).toEqual([
      {
        destroyChild: true,
        removeFromScene: true,
        sprite: expect.objectContaining({ destroyed: true })
      }
    ]);
  });

  it('only damages a nearby enemy once within the cooldown window', () => {
    const { scene } = createScene();
    const manager = new BladeManager(scene);
    const enemy = { active: true, nextBladeDamageAt: 0, x: 10, y: 0 };
    const damageEnemy = vi.fn();
    const player = {
      sprite: { x: 0, y: 0 },
      stats: {
        bladeUnlocked: true,
        bladeCount: 1,
        bladeDamage: 7,
        bladeOrbitRadius: 0,
        bladeOrbitSpeed: 0
      }
    };

    manager.syncToPlayer(player.stats);
    manager.update(player, player.stats, 16, 1000, [enemy], { damageEnemy });
    manager.update(player, player.stats, 16, 1200, [enemy], { damageEnemy });

    expect(damageEnemy).toHaveBeenCalledTimes(1);
    expect(enemy.nextBladeDamageAt).toBe(1280);
  });

  it('keeps locked blades hidden and non-damaging', () => {
    const { scene } = createScene();
    const manager = new BladeManager(scene);
    const enemy = { active: true, nextBladeDamageAt: 0, x: 10, y: 0 };
    const damageEnemy = vi.fn();
    const player = {
      sprite: { x: 0, y: 0 },
      stats: {
        bladeUnlocked: false,
        bladeCount: 0,
        bladeDamage: 7,
        bladeOrbitRadius: 0,
        bladeOrbitSpeed: 0
      }
    };

    manager.syncToPlayer({ bladeCount: 1 });
    manager.update(player, player.stats, 16, 1000, [enemy], { damageEnemy });

    expect(manager.group.getChildren()[0].visible).toBe(false);
    expect(damageEnemy).not.toHaveBeenCalled();
  });
});
