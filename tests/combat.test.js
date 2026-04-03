import { describe, expect, it } from 'vitest';
import {
  getNearestEnemy,
  getProjectileVelocity,
  getRicochetTarget,
  getShotDirections,
  registerProjectileHit
} from '../src/game/logic/combat.js';
import { ProjectileManager } from '../src/game/systems/ProjectileManager.js';

describe('getNearestEnemy', () => {
  it('returns the closest living enemy', () => {
    const player = { x: 0, y: 0 };
    const enemies = [
      { active: true, x: 100, y: 0, id: 'far' },
      { active: true, x: 25, y: 0, id: 'near' },
      { active: false, x: 5, y: 0, id: 'inactive' }
    ];

    expect(getNearestEnemy(player, enemies)?.id).toBe('near');
  });

  it('returns null when no active enemies exist', () => {
    expect(getNearestEnemy({ x: 0, y: 0 }, [{ active: false, x: 5, y: 5 }])).toBeNull();
  });
});

describe('getProjectileVelocity', () => {
  it('returns normalized velocity scaled by projectile speed', () => {
    expect(getProjectileVelocity({ x: 0, y: 0 }, { x: 3, y: 4 }, 500)).toEqual({
      x: 300,
      y: 400
    });
  });
});

describe('getShotDirections', () => {
  it('returns one angle for a single-shot weapon', () => {
    expect(getShotDirections({ x: 1, y: 0 }, 1, 14)).toEqual([{ x: 1, y: 0 }]);
  });

  it('returns a symmetric spread for multishot', () => {
    const directions = getShotDirections({ x: 1, y: 0 }, 3, 20);

    expect(directions).toHaveLength(3);
    expect(directions[0]).not.toEqual(directions[1]);
    expect(directions[1]).not.toEqual(directions[2]);
    expect(directions[0].x).toBeCloseTo(directions[2].x, 3);
    expect(directions[0].y).toBeCloseTo(-directions[2].y, 3);
    expect(directions[1]).toEqual({ x: 1, y: 0 });
  });
});

describe('getRicochetTarget', () => {
  it('finds the nearest new nearby enemy that is not the one just hit', () => {
    const currentEnemy = { x: 100, y: 100, active: true, id: 'first' };
    const closerEnemy = { x: 110, y: 102, active: true, id: 'closer' };
    const nextEnemy = { x: 130, y: 110, active: true, id: 'second' };

    expect(getRicochetTarget(currentEnemy, [currentEnemy, nextEnemy, closerEnemy], 80)?.id).toBe(
      'closer'
    );
  });

  it('rejects targets beyond the ricochet range', () => {
    const currentEnemy = { x: 100, y: 100, active: true, id: 'first' };
    const distantEnemy = { x: 250, y: 250, active: true, id: 'second' };

    expect(getRicochetTarget(currentEnemy, [currentEnemy, distantEnemy], 80)).toBeNull();
  });
});

describe('registerProjectileHit', () => {
  it('returns false when the same enemy is seen twice by the same projectile', () => {
    const projectile = {};
    const enemy = { id: 'enemy-1' };

    expect(registerProjectileHit(projectile, enemy)).toBe(true);
    expect(registerProjectileHit(projectile, enemy)).toBe(false);
  });

  it('tracks separate enemies independently', () => {
    const projectile = {};

    expect(registerProjectileHit(projectile, { id: 'enemy-1' })).toBe(true);
    expect(registerProjectileHit(projectile, { id: 'enemy-2' })).toBe(true);
  });
});

describe('ProjectileManager', () => {
  function createManager() {
    const projectiles = [];

    const group = {
      children: {
        iterate: (callback) => {
          projectiles.forEach(callback);
        }
      },
      create: (x, y, key) => {
        const projectile = {
          active: true,
          body: { velocity: { x: 0, y: 0 } },
          expiresAt: 0,
          key,
          setCircle: () => {},
          setDepth: () => {},
          setVelocity(xVel, yVel) {
            this.body.velocity = { x: xVel, y: yVel };
          },
          x,
          y
        };

        projectiles.push(projectile);
        return projectile;
      }
    };

    const scene = {
      physics: {
        add: {
          group: () => group
        }
      }
    };

    return { group, manager: new ProjectileManager(scene), projectiles };
  }

  it('emits one projectile per shot direction and preserves branch counters', () => {
    const { manager, projectiles } = createManager();
    const player = {
      sprite: { x: 0, y: 0 },
      stats: {
        fireCooldownMs: 150,
        projectileCount: 3,
        projectileDamage: 9,
        projectilePierce: 2,
        projectileRicochet: 1,
        projectileSpeed: 120,
        projectileSpreadDeg: 20
      }
    };
    const enemies = [{ active: true, id: 'target', x: 100, y: 0 }];

    const shots = manager.tryFire(player, enemies, 0);

    expect(shots).toHaveLength(3);
    expect(projectiles).toHaveLength(3);
    expect(shots.every((shot) => shot.damage === 9)).toBe(true);
    expect(shots.every((shot) => shot.remainingPierce === 2)).toBe(true);
    expect(shots.every((shot) => shot.remainingRicochet === 1)).toBe(true);
  });

  it('skips duplicate hits and ricochets to a fresh target', () => {
    const { manager } = createManager();
    const player = {
      sprite: { x: 0, y: 0 },
      stats: {
        fireCooldownMs: 150,
        projectileCount: 1,
        projectileDamage: 9,
        projectilePierce: 0,
        projectileRicochet: 2,
        projectileSpeed: 120,
        projectileSpreadDeg: 0
      }
    };
    const enemy1 = { active: true, id: 'enemy-1', x: 100, y: 0 };
    const enemy2 = { active: true, id: 'enemy-2', x: 130, y: 0 };
    const enemy3 = { active: true, id: 'enemy-3', x: 170, y: 30 };
    const enemyManager = {
      damageEnemyCalls: [],
      damageEnemy(enemy, damage) {
        this.damageEnemyCalls.push({ damage, enemy });
      },
      getLivingEnemies: () => [enemy1, enemy2, enemy3]
    };
    const projectile = manager.tryFire(player, [enemy1, enemy2, enemy3], 0)[0];

    manager.handleEnemyHit(projectile, enemy1, enemyManager);
    expect(enemyManager.damageEnemyCalls).toHaveLength(1);
    expect(enemyManager.damageEnemyCalls[0].enemy).toBe(enemy1);

    manager.handleEnemyHit(projectile, enemy1, enemyManager);
    expect(enemyManager.damageEnemyCalls).toHaveLength(1);

    manager.handleEnemyHit(projectile, enemy2, enemyManager);
    expect(enemyManager.damageEnemyCalls).toHaveLength(2);
    expect(enemyManager.damageEnemyCalls[1].enemy).toBe(enemy2);
    expect(projectile.body.velocity.x).toBeCloseTo(170 / Math.hypot(170, 30) * 120, 3);
    expect(projectile.body.velocity.y).toBeCloseTo(30 / Math.hypot(170, 30) * 120, 3);
  });
});
