import { describe, expect, it, vi } from 'vitest';
import {
  advanceBoomerang,
  createBoomerangDirections,
  registerBoomerangHit
} from '../src/game/logic/boomerang.js';
import { BoomerangManager } from '../src/game/systems/BoomerangManager.js';

describe('createBoomerangDirections', () => {
  it('creates a symmetric spread for multiple throws', () => {
    const directions = createBoomerangDirections({ x: 1, y: 0 }, 3, 22);

    expect(directions).toHaveLength(3);
    expect(directions[1]).toEqual({ x: 1, y: 0 });
    expect(directions[0].y).toBeCloseTo(-directions[2].y, 3);
  });
});

describe('advanceBoomerang', () => {
  it('switches to returning mode after reaching max range', () => {
    const boomerang = { x: 0, y: 0, directionX: 1, directionY: 0, speed: 100, maxDistance: 80, traveled: 79, returning: false };

    advanceBoomerang(boomerang, { x: 0, y: 0 }, 20);

    expect(boomerang.returning).toBe(true);
    expect(boomerang.traveled).toBeGreaterThanOrEqual(80);
  });
});

describe('registerBoomerangHit', () => {
  it('prevents the same boomerang from hitting the same enemy twice', () => {
    const boomerang = {};
    const enemy = { id: 'enemy-1' };

    expect(registerBoomerangHit(boomerang, enemy)).toBe(true);
    expect(registerBoomerangHit(boomerang, enemy)).toBe(false);
  });
});

describe('BoomerangManager', () => {
  it('throws boomerangs, damages fresh enemies, and despawns on return', () => {
    const sprites = [];
    const scene = {
      add: {
        image: () => {
          const sprite = {
            active: true,
            x: 0,
            y: 0,
            rotation: 0,
            setDepth() { return this; },
            setPosition(x, y) { this.x = x; this.y = y; return this; },
            setRotation(rotation) { this.rotation = rotation; return this; },
            destroy() { this.active = false; }
          };
          sprites.push(sprite);
          return sprite;
        }
      }
    };
    const manager = new BoomerangManager(scene);
    const damageEnemy = vi.fn();
    const player = { sprite: { x: 0, y: 0 } };
    const stats = {
      boomerangUnlocked: true,
      boomerangCount: 1,
      boomerangDamage: 15,
      boomerangRange: 80,
      boomerangCooldownMs: 900
    };
    const enemy = { active: true, id: 'near', x: 30, y: 0 };

    manager.update(player, stats, 100, 1000, [enemy], { damageEnemy });
    manager.update(player, stats, 700, 1700, [enemy], { damageEnemy });
    manager.update(player, stats, 700, 2400, [enemy], { damageEnemy });

    expect(damageEnemy).toHaveBeenCalledTimes(1);
    expect(sprites.some((sprite) => sprite.active)).toBe(false);
  });
});
